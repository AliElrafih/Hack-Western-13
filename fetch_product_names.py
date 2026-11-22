"""Collect names for the Logitech products found by pull_logitech_reviews.py.

Streams meta_Electronics.jsonl again and saves, for each Logitech parent_asin:
    data/reviews/logitech_products.json  {parent_asin: {"title": ..., "category": ...}}
"""
import json

from pull_logitech_reviews import ASIN_CACHE, META_URL, OUT_DIR, log, stream_lines

OUT = OUT_DIR / "logitech_products.json"


def main() -> None:
    asins = set(json.loads(ASIN_CACHE.read_text()))
    products = {}
    for raw in stream_lines(META_URL):
        if b"ogitech" not in raw:
            continue
        item = json.loads(raw)
        if item.get("parent_asin") in asins:
            cats = item.get("categories") or []
            products[item["parent_asin"]] = {
                "title": item.get("title"),
                "category": cats[-1] if cats else item.get("main_category"),
            }
    OUT.write_text(json.dumps(products, indent=1), encoding="utf-8")
    log(f"DONE: names for {len(products)} of {len(asins)} Logitech products -> {OUT}")


if __name__ == "__main__":
    main()
