"""Build the weekly table (data/weeks.json): one row per Mon-Fri trading week.

Stock half: Logitech and NASDAQ weekly % change (Friday close to Friday close)
and Logitech's excess return over the market.

Review half (optional, once Gemini scores exist): average sentiment, average
stars and review count per week. Weekend reviews count toward the following week.

Usage:
    python build_weekly_table.py                      # stock half only
    python build_weekly_table.py --reviews scored.json  # stock + reviews (.json array or .jsonl)
"""
import argparse
import json
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).parent / "data"
LOGI_CSV = DATA_DIR / "logitech_2016_2017.csv"
NASDAQ_CSV = DATA_DIR / "nasdaq_2016_2017.csv"
OUT_JSON = DATA_DIR / "weeks.json"

# Weeks end on Friday. Pandas "W-FRI" bins run Saturday -> Friday,
# so Saturday/Sunday reviews land in the following trading week.
WEEK_RULE = "W-FRI"
MARKET_TZ = "America/New_York"

# Field names in the scored review file.
TIMESTAMP_FIELD = "timestamp"  # milliseconds since 1970, UTC
SENTIMENT_FIELD = "sentiment_score"  # Gemini score, -100 to +100
RATING_FIELD = "rating"              # stars, 1-5
DEDUPE_ON = ["user_id", "text"]      # same person posting the same review twice

# Weeks with fewer reviews than this are flagged and left out of the model
# (e.g. a week that only has a weekend's worth of reviews at the edge of the data).
MIN_REVIEWS = 300


def weekly_close(csv_path: Path) -> pd.Series:
    prices = pd.read_csv(csv_path, index_col="Date", parse_dates=True)["Adj Close"]
    # Last trading day of each week (Thursday when Friday is a holiday).
    return prices.resample(WEEK_RULE).last()


def stock_half() -> pd.DataFrame:
    logi = weekly_close(LOGI_CSV)
    nasdaq = weekly_close(NASDAQ_CSV)

    weeks = pd.DataFrame(index=logi.index)
    weeks["logi_price"] = logi
    weeks["logi_pct"] = logi.pct_change() * 100
    weeks["nasdaq_pct"] = nasdaq.pct_change() * 100
    weeks["excess"] = weeks["logi_pct"] - weeks["nasdaq_pct"]
    return weeks


def load_reviews(path: Path) -> pd.DataFrame:
    if path.suffix == ".jsonl":
        return pd.read_json(path, lines=True)
    return pd.read_json(path)


def review_half(path: Path) -> pd.DataFrame:
    reviews = load_reviews(path)
    reviews = reviews.dropna(subset=[SENTIMENT_FIELD])
    before = len(reviews)
    reviews = reviews.drop_duplicates(subset=DEDUPE_ON)
    print(f"Reviews: {before} scored, {before - len(reviews)} duplicates removed")

    when = pd.to_datetime(reviews[TIMESTAMP_FIELD], unit="ms", utc=True)
    # Convert to New York time so a Friday-evening review isn't pushed into Saturday (UTC).
    reviews["posted"] = when.dt.tz_convert(MARKET_TZ).dt.tz_localize(None)

    grouped = reviews.set_index("posted").resample(WEEK_RULE)
    return pd.DataFrame({
        "sentiment": grouped[SENTIMENT_FIELD].mean(),
        "stars": grouped[RATING_FIELD].mean(),
        "review_count": grouped[SENTIMENT_FIELD].count(),
    })


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--reviews", type=Path, help="Scored reviews file (.json or .jsonl)")
    args = parser.parse_args()

    weeks = stock_half()

    if args.reviews:
        # Left join: keep exactly the trading weeks; reviews outside them are dropped.
        weeks = weeks.join(review_half(args.reviews), how="left")
        weeks["review_count"] = weeks["review_count"].fillna(0).astype(int)
        weeks["low_data"] = weeks["review_count"] < MIN_REVIEWS
    else:
        weeks["sentiment"] = None
        weeks["stars"] = None
        weeks["review_count"] = None
        weeks["low_data"] = None

    weeks.insert(0, "week_start", (weeks.index - pd.Timedelta(days=4)).strftime("%Y-%m-%d"))
    weeks.insert(1, "week_end", weeks.index.strftime("%Y-%m-%d"))
    weeks = weeks.round({"logi_price": 2, "logi_pct": 2, "nasdaq_pct": 2, "excess": 2,
                         "sentiment": 1, "stars": 2})

    records = json.loads(weeks.to_json(orient="records"))  # NaN -> null
    OUT_JSON.write_text(json.dumps(records, indent=2), encoding="utf-8")

    print(f"Saved {len(records)} weeks to {OUT_JSON}")
    print(weeks.reset_index(drop=True).head(5).to_string())


if __name__ == "__main__":
    main()
