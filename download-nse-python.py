#!/usr/bin/env python3
"""
Download REAL NSE/NIFTY data using yfinance
"""

import json
import sys
from datetime import datetime, timedelta

try:
    import yfinance as yf
    print("✓ yfinance available")
except ImportError:
    print("Installing yfinance...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "yfinance"])
    import yfinance as yf

# Download 6 months of NIFTY data
print("\n╔════════════════════════════════════════════════════════════════╗")
print("║       DOWNLOADING REAL NSE/NIFTY DATA (6 MONTHS)              ║")
print("╚════════════════════════════════════════════════════════════════╝\n")

print("📥 Downloading from Yahoo Finance (via yfinance)...")

# NIFTY 50 ticker
ticker = "^NSEI"

# Get 6 months of data
end_date = datetime.now()
start_date = end_date - timedelta(days=180)

try:
    df = yf.download(ticker, start=start_date.strftime('%Y-%m-%d'),
                     end=end_date.strftime('%Y-%m-%d'), progress=False)

    if df.empty:
        print("❌ No data received")
        sys.exit(1)

    # Convert to JSON format
    data = []
    for date, row in df.iterrows():
        data.append({
            "date": date.strftime('%Y-%m-%d'),
            "open": float(row['Open']),
            "high": float(row['High']),
            "low": float(row['Low']),
            "close": float(row['Close']),
            "volume": int(row['Volume']) if 'Volume' in row and row['Volume'] > 0 else 0
        })

    # Save to file
    output_path = '/root/ankr-labs-nx/packages/vyomo-anomaly-agent/data/nifty-real-6months.json'

    import os
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"✅ SUCCESS! Downloaded {len(data)} days of REAL market data")
    print(f"💾 Saved to: {output_path}\n")

    # Show summary
    print("📊 DATA SUMMARY")
    print("─────────────────────────────────────────────────────────────────")
    print(f"Total Days:     {len(data)}")
    print(f"Date Range:     {data[0]['date']} → {data[-1]['date']}")

    prices = [d['close'] for d in data]
    min_price = min(prices)
    max_price = max(prices)
    avg_price = sum(prices) / len(prices)

    print(f"Price Range:    ₹{min_price:.2f} - ₹{max_price:.2f}")
    print(f"Average Price:  ₹{avg_price:.2f}")
    print(f"Volatility:     {(max_price - min_price) / avg_price * 100:.2f}%")

    volumes = [d['volume'] for d in data if d['volume'] > 0]
    if volumes:
        avg_volume = sum(volumes) / len(volumes)
        print(f"Avg Volume:     {avg_volume / 1000000:.2f}M")

    print("\n🔍 Sample Data (first 5 days):")
    for d in data[:5]:
        vol = f" Vol: {d['volume'] / 1000000:.2f}M" if d['volume'] > 0 else ""
        print(f"{d['date']}  Open: ₹{d['open']:.2f}  Close: ₹{d['close']:.2f}{vol}")

    print("\n✅ Real data ready for analysis!")

except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
