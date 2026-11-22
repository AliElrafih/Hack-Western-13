"""Earnings angle: does review sentiment going into an earnings report line up with the stock's reaction?

For each Logitech earnings report (dates and EPS from Yahoo Finance):
  - reaction day: the first trading day the market could react (next day for after-close reports)
  - reaction: Logitech's move minus NASDAQ's move on that day (excess, %)
  - sentiment going in: average weekly sentiment over the 4 weeks before the reaction week,
    compared with the average for the whole year of reviews

Also re-checks the 1-week regression with earnings weeks removed, to see whether
the correlation exists outside earnings.

Writes data/earnings.json (also used for the UI's timeline markers).
"""
import json
from pathlib import Path

import pandas as pd
import yfinance as yf
from scipy import stats

DATA_DIR = Path(__file__).parent / "data"
LOGI_CSV = DATA_DIR / "logitech_2016_2017.csv"
NASDAQ_CSV = DATA_DIR / "nasdaq_2016_2017.csv"
WEEKS_JSON = DATA_DIR / "weeks.json"
OUT_JSON = DATA_DIR / "earnings.json"

START, END = "2016-01-01", "2018-01-01"
PRE_WEEKS = 4
MARKET_TZ = "America/New_York"


def earnings_dates() -> pd.DataFrame:
    d = yf.Ticker("LOGI").get_earnings_dates(limit=50)
    d.index = d.index.tz_convert(MARKET_TZ)
    d = d.sort_index()
    d = d[(d.index >= pd.Timestamp(START, tz=MARKET_TZ)) & (d.index < pd.Timestamp(END, tz=MARKET_TZ))]
    return d.rename(columns={"EPS Estimate": "eps_estimate", "Reported EPS": "eps_reported",
                             "Surprise(%)": "eps_surprise_pct"})


def daily_excess() -> pd.Series:
    logi = pd.read_csv(LOGI_CSV, index_col="Date", parse_dates=True)["Adj Close"].pct_change() * 100
    nasdaq = pd.read_csv(NASDAQ_CSV, index_col="Date", parse_dates=True)["Adj Close"].pct_change() * 100
    return logi - nasdaq


def reaction_day(announced: pd.Timestamp, trading_days: pd.DatetimeIndex) -> pd.Timestamp:
    day = pd.Timestamp(announced.date())
    before_open = announced.hour < 9 or (announced.hour == 9 and announced.minute < 30)
    if before_open and day in trading_days:
        return day
    return trading_days[trading_days > day][0]


def main() -> None:
    weeks = pd.DataFrame(json.loads(WEEKS_JSON.read_text(encoding="utf-8")))
    weeks["week_end"] = pd.to_datetime(weeks["week_end"])
    usable = weeks[(weeks["low_data"] == False) & weeks["sentiment"].notna()]  # noqa: E712
    year_avg = usable["sentiment"].mean()

    excess = daily_excess()
    trading_days = excess.index

    rows = []
    for announced, e in earnings_dates().iterrows():
        react = reaction_day(announced, trading_days)
        react_week_end = react + pd.offsets.Week(weekday=4) if react.weekday() != 4 else react
        pre = usable[usable["week_end"] < react_week_end].tail(PRE_WEEKS)
        has_sentiment = len(pre) > 0 and (react_week_end - pre["week_end"].max()).days <= 7
        pre_avg = pre["sentiment"].mean() if has_sentiment else None
        rows.append({
            "announced": announced.strftime("%Y-%m-%d %H:%M"),
            "timing": "before open" if announced.hour < 12 else "after close",
            "reaction_day": react.strftime("%Y-%m-%d"),
            "reaction_week_end": react_week_end.strftime("%Y-%m-%d"),
            "reaction_excess_pct": round(float(excess.loc[react]), 2),
            "eps_estimate": float(e["eps_estimate"]),
            "eps_reported": float(e["eps_reported"]),
            "eps_surprise_pct": round(float(e["eps_surprise_pct"]), 1),
            "pre_sentiment": round(pre_avg, 1) if pre_avg is not None else None,
            "pre_sentiment_vs_year": round(pre_avg - year_avg, 1) if pre_avg is not None else None,
            "pre_weeks_used": len(pre) if has_sentiment else 0,
        })

    OUT_JSON.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    table = pd.DataFrame(rows)
    print(f"Year-average weekly sentiment: {year_avg:.1f}\n")
    print(table[["reaction_day", "timing", "eps_surprise_pct", "reaction_excess_pct",
                 "pre_sentiment", "pre_sentiment_vs_year", "pre_weeks_used"]].to_string(index=False))

    with_sent = table.dropna(subset=["pre_sentiment_vs_year"])
    if len(with_sent) >= 3:
        agree = ((with_sent["pre_sentiment_vs_year"] > 0) == (with_sent["reaction_excess_pct"] > 0)).sum()
        print(f"\nSentiment direction matched the reaction in {agree} of {len(with_sent)} reports with review data")

    # ---- Does the weekly 1-week-delay correlation survive without earnings weeks? ----
    earnings_weeks = set(pd.to_datetime(table["reaction_week_end"]))
    w = weeks.set_index("week_end")
    pairs = pd.DataFrame({"x": w["sentiment"].where(w["low_data"] == False),  # noqa: E712
                          "y": w["excess"].shift(-1),
                          "y_week": pd.Series(w.index, index=w.index).shift(-1)}).dropna()
    all_r = stats.pearsonr(pairs["x"], pairs["y"])
    no_earn = pairs[~pairs["y_week"].isin(earnings_weeks)]
    ne_r = stats.pearsonr(no_earn["x"], no_earn["y"])
    print(f"\n1-week delay, all weeks:           r={all_r[0]:+.3f} p={all_r[1]:.3f} n={len(pairs)}")
    print(f"1-week delay, earnings weeks out:  r={ne_r[0]:+.3f} p={ne_r[1]:.3f} n={len(no_earn)}")
    print(f"\nSaved {OUT_JSON}")


if __name__ == "__main__":
    main()
