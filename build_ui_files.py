"""Build the static JSON files the UI reads that don't come from the model.

  data/companies.json     companies for Screen 1 (Logitech live, others coming soon)
  data/week_details.json  per trading week: sentiment mix, most-reviewed products, example reviews

Gemini weekly summaries are not generated here; each week has "summary": null until they are.
Product names come from data/reviews/logitech_products.json (fetch_product_names.py) when present.

Usage:
    python build_ui_files.py --reviews data/reviews/LOGI_reviews_sentiment.jsonl
"""
import argparse
import json
import re
from pathlib import Path

import pandas as pd

from build_weekly_table import (DEDUPE_ON, MARKET_TZ, MIN_REVIEWS, RATING_FIELD, SENTIMENT_FIELD,
                                TIMESTAMP_FIELD, WEEK_RULE, load_reviews)

DATA_DIR = Path(__file__).parent / "data"
WEEKS_JSON = DATA_DIR / "weeks.json"
PRODUCTS_JSON = DATA_DIR / "reviews" / "logitech_products.json"
COMPANIES_OUT = DATA_DIR / "companies.json"
DETAILS_OUT = DATA_DIR / "week_details.json"

TOP_PRODUCTS = 5
EXAMPLES_PER_SIDE = 2      # most helpful positive + most helpful negative reviews per week
POSITIVE, NEGATIVE = 30, -30  # sentiment cut-offs for the positive / neutral / negative mix
EXCERPT_CHARS = 400

COMPANIES = [
    {"name": "Logitech", "ticker": "LOGI", "sells": "Mice, keyboards, webcams, headsets and other computer accessories",
     "status": "live", "reviews_from": "2016-01-01", "reviews_to": "2016-12-31"},
    {"name": "Crocs", "ticker": "CROX", "sells": "Footwear", "status": "coming_soon"},
    {"name": "GoPro", "ticker": "GPRO", "sells": "Action cameras and accessories", "status": "coming_soon"},
]


def clean(text: str) -> str:
    text = re.sub(r"<br\s*/?>", " ", text or "")
    text = re.sub(r"\s+", " ", text).strip()
    return text if len(text) <= EXCERPT_CHARS else text[:EXCERPT_CHARS].rsplit(" ", 1)[0] + "…"


def product_names() -> dict:
    if PRODUCTS_JSON.exists():
        return json.loads(PRODUCTS_JSON.read_text(encoding="utf-8"))
    print(f"Note: {PRODUCTS_JSON.name} not found yet; using product IDs in place of names")
    return {}


def example(row, names: dict) -> dict:
    return {
        "product": (names.get(row.parent_asin) or {}).get("title") or row.parent_asin,
        "posted": row.posted.strftime("%Y-%m-%d"),
        "stars": int(getattr(row, RATING_FIELD)),
        "sentiment": int(getattr(row, SENTIMENT_FIELD)),
        "helpful_votes": int(row.helpful_vote),
        "title": clean(row.title),
        "excerpt": clean(row.text),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--reviews", type=Path, required=True)
    args = parser.parse_args()

    COMPANIES_OUT.write_text(json.dumps(COMPANIES, indent=2), encoding="utf-8")

    names = product_names()
    reviews = load_reviews(args.reviews).dropna(subset=[SENTIMENT_FIELD]).drop_duplicates(subset=DEDUPE_ON)
    posted = pd.to_datetime(reviews[TIMESTAMP_FIELD], unit="ms", utc=True).dt.tz_convert(MARKET_TZ).dt.tz_localize(None)
    reviews = reviews.assign(posted=posted,
                             week_end=posted.dt.to_period(WEEK_RULE).dt.end_time.dt.strftime("%Y-%m-%d"))

    trading_weeks = {w["week_end"]: w for w in json.loads(WEEKS_JSON.read_text(encoding="utf-8"))}
    details = []
    for week_end, wk in reviews.groupby("week_end"):
        if week_end not in trading_weeks:
            continue
        s = wk[SENTIMENT_FIELD]
        products = (wk.groupby("parent_asin")[SENTIMENT_FIELD].agg(["count", "mean"])
                    .sort_values("count", ascending=False).head(TOP_PRODUCTS))
        pos = wk[s >= POSITIVE].sort_values("helpful_vote", ascending=False).head(EXAMPLES_PER_SIDE)
        neg = wk[s <= NEGATIVE].sort_values("helpful_vote", ascending=False).head(EXAMPLES_PER_SIDE)
        details.append({
            "week_start": trading_weeks[week_end]["week_start"],
            "week_end": week_end,
            "review_count": len(wk),
            "low_data": len(wk) < MIN_REVIEWS,
            "sentiment": round(float(s.mean()), 1),
            "mix_pct": {"positive": round(float((s >= POSITIVE).mean() * 100), 1),
                        "neutral": round(float(((s > NEGATIVE) & (s < POSITIVE)).mean() * 100), 1),
                        "negative": round(float((s <= NEGATIVE).mean() * 100), 1)},
            "top_products": [{"parent_asin": asin,
                              "product": (names.get(asin) or {}).get("title") or asin,
                              "category": (names.get(asin) or {}).get("category"),
                              "reviews": int(row["count"]), "sentiment": round(float(row["mean"]), 1)}
                             for asin, row in products.iterrows()],
            "examples": [example(r, names) for r in pos.itertuples()] + [example(r, names) for r in neg.itertuples()],
            "summary": None,
        })

    DETAILS_OUT.write_text(json.dumps(details, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Saved {COMPANIES_OUT.name} ({len(COMPANIES)} companies) and {DETAILS_OUT.name} ({len(details)} weeks)")


if __name__ == "__main__":
    main()
