"""Download Logitech (LOGI) and NASDAQ Composite daily prices from Yahoo Finance, 2016-2017."""
from pathlib import Path

import yfinance as yf

START = "2016-01-01"
END = "2018-01-01"  

TICKERS = {
    "LOGI": "logitech_2016_2017.csv",
    "^IXIC": "nasdaq_2016_2017.csv",  
}

OUT_DIR = Path(__file__).parent / "data"
OUT_DIR.mkdir(exist_ok=True)

for ticker, filename in TICKERS.items():
    df = yf.download(
        ticker,
        start=START,
        end=END,
        interval="1d",
        auto_adjust=False,
        progress=False,
    )

    if df.columns.nlevels > 1:
        df.columns = df.columns.get_level_values(0)

    df.index.name = "Date"
    out = OUT_DIR / filename
    df.to_csv(out)

    print(f"{ticker}: saved {len(df)} rows to {out} "
          f"({df.index.min().date()} -> {df.index.max().date()})")
