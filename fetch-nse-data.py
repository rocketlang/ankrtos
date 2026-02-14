#!/usr/bin/env python3
"""
Download REAL NSE NIFTY 50 data using nsepy
"""

import json
import sys
from datetime import datetime, timedelta

# Install nsepy if needed
try:
    from nsepy import get_history
    from nsepy.indices import get_index_list
except ImportError:
    print("📦 Installing nsepy...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "--break-system-packages", "-q", "nsepy"], check=True)
    from nsepy import get_history

print("\n╔════════════════════════════════════════════════════════════════╗")
print("║       DOWNLOADING REAL NSE NIFTY 50 DATA (6 MONTHS)           ║")
print("╚════════════════════════════════════════════════════════════════╝\n")

print("📥 Downloading from NSE India (via nsepy)...")

# Calculate date range (6 months)
end_date = datetime.now()
start_date = end_date - timedelta(days=180)

try:
    # Download NIFTY 50 index data
    print(f"Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")

    df = get_history(
        symbol="NIFTY 50",
        start=start_date,
        end=end_date,
        index=True
    )

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
            "volume": int(row['Volume']) if 'Volume' in row else 0
        })

    # Save to file
    import os
    output_dir = '/root/ankr-labs-nx/packages/vyomo-anomaly-agent/data'
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, 'nifty-real-6months.json')

    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"\n✅ SUCCESS! Downloaded {len(data)} days of REAL NSE data")
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
    print(f"Total Move:     {((data[-1]['close'] - data[0]['close']) / data[0]['close'] * 100):.2f}%")
    print(f"Volatility:     {((max_price - min_price) / avg_price * 100):.2f}%")

    print("\n🔍 Sample Data (first 5 days):")
    for d in data[:5]:
        change = ((d['close'] - d['open']) / d['open'] * 100)
        print(f"{d['date']}  Open: ₹{d['open']:.2f}  Close: ₹{d['close']:.2f}  Change: {change:+.2f}%")

    print("\n🔍 Recent Data (last 5 days):")
    for d in data[-5:]:
        change = ((d['close'] - d['open']) / d['open'] * 100)
        print(f"{d['date']}  Open: ₹{d['open']:.2f}  Close: ₹{d['close']:.2f}  Change: {change:+.2f}%")

    print("\n✅ Real NSE data ready for algorithm testing!")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
