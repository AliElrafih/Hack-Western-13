"""Linear regression: does weekly review sentiment predict Logitech's excess stock return?

Reads data/weeks.json (built by build_weekly_table.py with --reviews) and writes:
  data/delays.json      how strongly each signal matched the stock at each delay
  data/prediction.json  the chosen model's predictions on the held-out test weeks

Signals compared:
  sentiment         Gemini weekly average (-100 to +100)
  stars             average star rating (1-5), the baseline Gemini has to beat
  sentiment_change  change in Gemini sentiment from the previous week (exploratory)

Delay = number of weeks between the sentiment week and the stock week it is paired with.
0 = same week (for reference only; it can't be used to predict).
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

DATA_DIR = Path(__file__).parent / "data"
WEEKS_JSON = DATA_DIR / "weeks.json"
DELAYS_JSON = DATA_DIR / "delays.json"
PREDICTION_JSON = DATA_DIR / "prediction.json"

SIGNALS = ["sentiment", "stars", "sentiment_change"]
DELAYS = [0, 1, 2, 4]          # weeks; 4 is roughly one month
PREDICTIVE_DELAYS = [1, 2, 4]  # the ones the delay chart and the model choose from

# Reviews only cover 2016, so the honest test is inside 2016:
# fit on sentiment weeks up to this date, test on the weeks after.
TRAIN_END = "2016-08-31"


def load_weeks() -> pd.DataFrame:
    weeks = pd.DataFrame(json.loads(WEEKS_JSON.read_text(encoding="utf-8")))
    if weeks["sentiment"].isna().all():
        raise SystemExit("weeks.json has no sentiment yet. Run build_weekly_table.py --reviews <file> first.")
    weeks["week_end"] = pd.to_datetime(weeks["week_end"])
    weeks["sentiment_change"] = weeks["sentiment"].diff()
    # Signals from low-data weeks aren't trusted.
    weeks.loc[weeks["low_data"] == True, SIGNALS] = np.nan  # noqa: E712
    return weeks


def pairs(weeks: pd.DataFrame, signal: str, delay: int) -> pd.DataFrame:
    """Pair each week's signal with the excess return `delay` weeks later."""
    paired = pd.DataFrame({
        "signal_week": weeks["week_end"],
        "x": weeks[signal],
        "stock_week": weeks["week_end"].shift(-delay),
        "y": weeks["excess"].shift(-delay),
    })
    return paired.dropna()


def fit(p: pd.DataFrame) -> dict:
    res = stats.linregress(p["x"], p["y"])
    return {"n": len(p), "r": res.rvalue, "p_value": res.pvalue, "slope": res.slope,
            "intercept": res.intercept, "r2": res.rvalue ** 2}


def split(p: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    train = p[p["signal_week"] <= TRAIN_END]
    test = p[p["signal_week"] > TRAIN_END]
    return train, test


def test_model(p: pd.DataFrame) -> dict:
    train, test = split(p)
    model = fit(train)
    pred = model["intercept"] + model["slope"] * test["x"]
    hits = np.sign(pred) == np.sign(test["y"])
    return {"model": model, "train": train, "test": test, "pred": pred, "hits": hits,
            "hit_rate": hits.mean(), "always_up": (test["y"] > 0).mean()}


def r4(v: float) -> float:
    return round(float(v), 4)


def main() -> None:
    weeks = load_weeks()

    # ---- Full-period correlation at every delay -> delays.json ----
    rows = []
    for signal in SIGNALS:
        for delay in DELAYS:
            m = fit(pairs(weeks, signal, delay))
            rows.append({"signal": signal, "delay_weeks": delay, "n": m["n"], "r": r4(m["r"]),
                         "r2": r4(m["r2"]), "p_value": r4(m["p_value"]), "slope": r4(m["slope"])})
    DELAYS_JSON.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    print("Correlation with Logitech's excess return (all 2016 weeks)")
    print(pd.DataFrame(rows).to_string(index=False))

    # ---- Pick each signal's delay on TRAINING weeks only, then test ----
    results = {}
    for signal in SIGNALS:
        best = max(PREDICTIVE_DELAYS,
                   key=lambda d: abs(fit(split(pairs(weeks, signal, d))[0])["r"]))
        results[signal] = {"delay": best, **test_model(pairs(weeks, signal, best))}

    print(f"\nHeld-out test (fit on weeks up to {TRAIN_END}, delay chosen on training weeks only)")
    for signal, res in results.items():
        m = res["model"]
        print(f"  {signal:17s} delay={res['delay']}w  train r={m['r']:+.3f} (p={m['p_value']:.3f}, n={m['n']})"
              f"  test hit rate={res['hit_rate']:.0%} on {len(res['test'])} weeks"
              f"  (always-up baseline {res['always_up']:.0%})")

    # ---- prediction.json for the UI: the Gemini sentiment model ----
    main_res = results["sentiment"]
    m = main_res["model"]
    # Weekly sentiment only moves a few points, so describe a typical swing (1 standard deviation).
    typical_swing = main_res["train"]["x"].std()
    effect = m["slope"] * typical_swing
    prediction = {
        "signal": "sentiment",
        "delay_weeks": main_res["delay"],
        "train_period": f"weeks ending up to {TRAIN_END}",
        "test_period": f"weeks after {TRAIN_END}",
        "formula": {"intercept": r4(m["intercept"]), "slope": r4(m["slope"])},
        "plain_english": (f"When weekly sentiment is {typical_swing:.1f} points higher than usual "
                          f"(a typical swing), Logitech tends to "
                          f"{'beat' if effect >= 0 else 'trail'} the NASDAQ by {abs(effect):.2f}% "
                          f"{main_res['delay']} week(s) later."),
        "train_r": r4(m["r"]),
        "train_p_value": r4(m["p_value"]),
        "hit_rate": r4(main_res["hit_rate"]),
        "baseline_always_up": r4(main_res["always_up"]),
        "stars_hit_rate": r4(results["stars"]["hit_rate"]),
        "weeks": [
            {"signal_week": sw.strftime("%Y-%m-%d"), "stock_week": tw.strftime("%Y-%m-%d"),
             "sentiment": round(float(x), 1), "predicted_excess": round(float(pr), 2),
             "actual_excess": round(float(y), 2), "hit": bool(h)}
            for sw, tw, x, y, pr, h in zip(main_res["test"]["signal_week"], main_res["test"]["stock_week"],
                                           main_res["test"]["x"], main_res["test"]["y"],
                                           main_res["pred"], main_res["hits"])
        ],
    }
    PREDICTION_JSON.write_text(json.dumps(prediction, indent=2), encoding="utf-8")
    print(f"\n{prediction['plain_english']}")
    print(f"Saved {DELAYS_JSON.name} and {PREDICTION_JSON.name}")


if __name__ == "__main__":
    main()
