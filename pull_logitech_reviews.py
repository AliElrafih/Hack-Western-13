"""Pull Logitech reviews for one year from the McAuley Lab Amazon Reviews 2023 dataset.

Streams the files from Hugging Face and filters on the fly (nothing large is saved):
  1. meta_Electronics: collect products whose store or Brand starts with "Logitech"
  2. Electronics reviews: keep reviews of those products posted in the given year (New York time)

Output has the same shape as the raw dataset (ready for Gemini scoring):
    data/reviews/LOGI_reviews_<year>.jsonl

Usage:
    python pull_logitech_reviews.py --year 2017
"""
import argparse
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

BASE = "https://huggingface.co/datasets/McAuley-Lab/Amazon-Reviews-2023/resolve/main/raw"
META_URL = f"{BASE}/meta_categories/meta_Electronics.jsonl"
REVIEWS_URL = f"{BASE}/review_categories/Electronics.jsonl"

BRAND = "logitech"
MARKET_TZ = ZoneInfo("America/New_York")
OUT_DIR = Path(__file__).parent / "data" / "reviews"
ASIN_CACHE = OUT_DIR / "logitech_parent_asins.json"


def stream_lines(url: str):
    """Stream a remote file line by line through curl (follows redirects, retries)."""
    proc = subprocess.Popen(
        ["curl", "-sSL", "--retry", "5", "--retry-delay", "5", url],
        stdout=subprocess.PIPE, bufsize=1024 * 1024,
    )
    read = 0
    next_report = 500_000_000
    for raw in proc.stdout:
        read += len(raw)
        if read >= next_report:
            log(f"  {read / 1e9:.1f} GB read from {url.rsplit('/', 1)[-1]}")
            next_report += 500_000_000
        yield raw
    if proc.wait() != 0:
        raise RuntimeError(f"curl failed with exit code {proc.returncode} for {url}")


def log(msg: str) -> None:
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def is_logitech(item: dict) -> bool:
    store = (item.get("store") or "").strip().lower()
    details = item.get("details") or {}
    brand = (details.get("Brand") or details.get("brand") or "").strip().lower() if isinstance(details, dict) else ""
    return store.startswith(BRAND) or brand.startswith(BRAND)


def logitech_asins() -> set[str]:
    if ASIN_CACHE.exists():
        asins = set(json.loads(ASIN_CACHE.read_text()))
        log(f"Loaded {len(asins)} Logitech products from cache")
        return asins

    asins, n = set(), 0
    for raw in stream_lines(META_URL):
        n += 1
        if b"ogitech" not in raw:  # cheap pre-filter before parsing JSON
            continue
        item = json.loads(raw)
        if is_logitech(item):
            asins.add(item["parent_asin"])
        if n % 200_000 == 0:
            log(f"meta: {n:,} products scanned, {len(asins):,} Logitech")
    ASIN_CACHE.write_text(json.dumps(sorted(asins)))
    log(f"meta done: {n:,} products scanned, {len(asins):,} Logitech")
    return asins


def year_bounds_ms(year: int) -> tuple[int, int]:
    start = datetime(year, 1, 1, tzinfo=MARKET_TZ)
    end = datetime(year + 1, 1, 1, tzinfo=MARKET_TZ)
    return int(start.timestamp() * 1000), int(end.timestamp() * 1000)


def parent_asin_of(raw: bytes) -> str | None:
    key = b'"parent_asin": "'
    i = raw.find(key)
    if i < 0:
        return None
    j = raw.find(b'"', i + len(key))
    return raw[i + len(key):j].decode()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--year", type=int, required=True)
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"LOGI_reviews_{args.year}.jsonl"
    asins = logitech_asins()
    lo, hi = year_bounds_ms(args.year)

    n = kept = 0
    with open(out_path, "w", encoding="utf-8") as out:
        for raw in stream_lines(REVIEWS_URL):
            n += 1
            if n % 2_000_000 == 0:
                log(f"reviews: {n:,} scanned, {kept:,} kept")
            if parent_asin_of(raw) not in asins:
                continue
            review = json.loads(raw)
            if lo <= review["timestamp"] < hi:
                out.write(json.dumps(review) + "\n")
                kept += 1
    log(f"DONE: {n:,} reviews scanned, {kept:,} Logitech reviews from {args.year} -> {out_path}")


if __name__ == "__main__":
    sys.exit(main())
