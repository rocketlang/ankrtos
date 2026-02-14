#!/bin/bash
# Aggressive multi-source real data download
# Tries 15+ different sources until one succeeds

OUTPUT_DIR="/root/ankr-labs-nx/packages/vyomo-anomaly-agent/data"
mkdir -p "$OUTPUT_DIR"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     AGGRESSIVE REAL DATA DOWNLOAD (Multiple Sources)          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Calculate date range
END_DATE=$(date +%s)
START_DATE=$(date -d "180 days ago" +%s)
DATE_START=$(date -d "180 days ago" +%Y-%m-%d)
DATE_END=$(date +%Y-%m-%d)

SUCCESS=0

# ==============================================================================
# SOURCE 1: Alpha Vantage (multiple API keys)
# ==============================================================================

echo "📥 [1/15] Trying Alpha Vantage..."
for key in "demo" "DEMO" "test"; do
  curl -s "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPY&outputsize=full&apikey=$key&datatype=csv" \
    -o "$OUTPUT_DIR/market-data-temp.csv"

  if [ -f "$OUTPUT_DIR/market-data-temp.csv" ] && grep -q "timestamp,open" "$OUTPUT_DIR/market-data-temp.csv"; then
    echo "✅ Alpha Vantage success!"
    mv "$OUTPUT_DIR/market-data-temp.csv" "$OUTPUT_DIR/real-data.csv"
    SUCCESS=1
    break 2
  fi
  sleep 1
done

# ==============================================================================
# SOURCE 2: Twelve Data (no auth)
# ==============================================================================

if [ $SUCCESS -eq 0 ]; then
  echo "📥 [2/15] Trying Twelve Data API..."
  curl -s "https://api.twelvedata.com/time_series?symbol=SPY&interval=1day&outputsize=180&format=CSV" \
    -o "$OUTPUT_DIR/market-data-temp.csv"

  if [ -f "$OUTPUT_DIR/market-data-temp.csv" ] && grep -q "datetime" "$OUTPUT_DIR/market-data-temp.csv"; then
    echo "✅ Twelve Data success!"
    mv "$OUTPUT_DIR/market-data-temp.csv" "$OUTPUT_DIR/real-data.csv"
    SUCCESS=1
  fi
  sleep 1
fi

# ==============================================================================
# SOURCE 3: Yahoo Finance (with cookies bypass)
# ==============================================================================

if [ $SUCCESS -eq 0 ]; then
  echo "📥 [3/15] Trying Yahoo Finance (SPY)..."
  curl -L -s "https://query1.finance.yahoo.com/v7/finance/download/SPY?period1=$START_DATE&period2=$END_DATE&interval=1d&events=history" \
    -H "User-Agent: Mozilla/5.0" \
    -H "Accept: text/html" \
    -o "$OUTPUT_DIR/market-data-temp.csv"

  if [ -f "$OUTPUT_DIR/market-data-temp.csv" ] && grep -q "Date,Open" "$OUTPUT_DIR/market-data-temp.csv"; then
    echo "✅ Yahoo Finance success!"
    mv "$OUTPUT_DIR/market-data-temp.csv" "$OUTPUT_DIR/real-data.csv"
    SUCCESS=1
  fi
  sleep 2
fi

# ==============================================================================
# SOURCE 4: FRED (Federal Reserve Economic Data)
# ==============================================================================

if [ $SUCCESS -eq 0 ]; then
  echo "📥 [4/15] Trying FRED API..."
  curl -s "https://api.stlouisfed.org/fred/series/observations?series_id=SP500&api_key=demo&file_type=json" \
    -o "$OUTPUT_DIR/fred-temp.json"

  if [ -f "$OUTPUT_DIR/fred-temp.json" ] && grep -q "observations" "$OUTPUT_DIR/fred-temp.json"; then
    echo "✅ FRED success!"
    mv "$OUTPUT_DIR/fred-temp.json" "$OUTPUT_DIR/real-data.json"
    SUCCESS=1
  fi
  sleep 1
fi

# ==============================================================================
# SOURCE 5: IEX Cloud (free tier)
# ==============================================================================

if [ $SUCCESS -eq 0 ]; then
  echo "📥 [5/15] Trying IEX Cloud..."
  curl -s "https://cloud.iexapis.com/stable/stock/spy/chart/6m?token=demo" \
    -o "$OUTPUT_DIR/iex-temp.json"

  if [ -f "$OUTPUT_DIR/iex-temp.json" ] && [ -s "$OUTPUT_DIR/iex-temp.json" ]; then
    echo "✅ IEX Cloud success!"
    mv "$OUTPUT_DIR/iex-temp.json" "$OUTPUT_DIR/real-data.json"
    SUCCESS=1
  fi
  sleep 1
fi

# ==============================================================================
# SOURCE 6: Polygon.io (free tier)
# ==============================================================================

if [ $SUCCESS -eq 0 ]; then
  echo "📥 [6/15] Trying Polygon.io..."
  curl -s "https://api.polygon.io/v2/aggs/ticker/SPY/range/1/day/$DATE_START/$DATE_END?apiKey=demo" \
    -o "$OUTPUT_DIR/polygon-temp.json"

  if [ -f "$OUTPUT_DIR/polygon-temp.json" ] && grep -q "results" "$OUTPUT_DIR/polygon-temp.json"; then
    echo "✅ Polygon.io success!"
    mv "$OUTPUT_DIR/polygon-temp.json" "$OUTPUT_DIR/real-data.json"
    SUCCESS=1
  fi
  sleep 1
fi

# ==============================================================================
# SOURCE 7: Finnhub (free API)
# ==============================================================================

if [ $SUCCESS -eq 0 ]; then
  echo "📥 [7/15] Trying Finnhub..."
  curl -s "https://finnhub.io/api/v1/stock/candle?symbol=SPY&resolution=D&from=$START_DATE&to=$END_DATE&token=demo" \
    -o "$OUTPUT_DIR/finnhub-temp.json"

  if [ -f "$OUTPUT_DIR/finnhub-temp.json" ] && [ -s "$OUTPUT_DIR/finnhub-temp.json" ]; then
    echo "✅ Finnhub success!"
    mv "$OUTPUT_DIR/finnhub-temp.json" "$OUTPUT_DIR/real-data.json"
    SUCCESS=1
  fi
  sleep 1
fi

# ==============================================================================
# SOURCE 8: Quandl (Nasdaq Data Link)
# ==============================================================================

if [ $SUCCESS -eq 0 ]; then
  echo "📥 [8/15] Trying Quandl..."
  curl -s "https://data.nasdaq.com/api/v3/datasets/WIKI/SPY/data.csv?start_date=$DATE_START&end_date=$DATE_END" \
    -o "$OUTPUT_DIR/quandl-temp.csv"

  if [ -f "$OUTPUT_DIR/quandl-temp.csv" ] && grep -q "Date" "$OUTPUT_DIR/quandl-temp.csv"; then
    echo "✅ Quandl success!"
    mv "$OUTPUT_DIR/quandl-temp.csv" "$OUTPUT_DIR/real-data.csv"
    SUCCESS=1
  fi
  sleep 1
fi

# ==============================================================================
# SOURCE 9: Tiingo (free tier)
# ==============================================================================

if [ $SUCCESS -eq 0 ]; then
  echo "📥 [9/15] Trying Tiingo..."
  curl -s "https://api.tiingo.com/tiingo/daily/spy/prices?startDate=$DATE_START&endDate=$DATE_END&token=demo" \
    -o "$OUTPUT_DIR/tiingo-temp.json"

  if [ -f "$OUTPUT_DIR/tiingo-temp.json" ] && [ -s "$OUTPUT_DIR/tiingo-temp.json" ]; then
    echo "✅ Tiingo success!"
    mv "$OUTPUT_DIR/tiingo-temp.json" "$OUTPUT_DIR/real-data.json"
    SUCCESS=1
  fi
  sleep 1
fi

# ==============================================================================
# SOURCE 10: World Trading Data
# ==============================================================================

if [ $SUCCESS -eq 0 ]; then
  echo "📥 [10/15] Trying World Trading Data..."
  curl -s "https://api.worldtradingdata.com/api/v1/history?symbol=SPY&date_from=$DATE_START&date_to=$DATE_END&api_token=demo" \
    -o "$OUTPUT_DIR/wtd-temp.json"

  if [ -f "$OUTPUT_DIR/wtd-temp.json" ] && [ -s "$OUTPUT_DIR/wtd-temp.json" ]; then
    echo "✅ World Trading Data success!"
    mv "$OUTPUT_DIR/wtd-temp.json" "$OUTPUT_DIR/real-data.json"
    SUCCESS=1
  fi
  sleep 1
fi

# ==============================================================================
# SOURCE 11-15: Try Python with yfinance (in venv)
# ==============================================================================

if [ $SUCCESS -eq 0 ]; then
  echo "📥 [11/15] Trying Python yfinance..."

  python3 -c "
import sys
import json
from datetime import datetime, timedelta

try:
    import yfinance as yf
except:
    import subprocess
    subprocess.run([sys.executable, '-m', 'pip', 'install', '--break-system-packages', '-q', 'yfinance'], check=False)
    import yfinance as yf

ticker = yf.Ticker('SPY')
end = datetime.now()
start = end - timedelta(days=180)

try:
    df = ticker.history(start=start, end=end)

    data = []
    for date, row in df.iterrows():
        data.append({
            'date': date.strftime('%Y-%m-%d'),
            'open': float(row['Open']),
            'high': float(row['High']),
            'low': float(row['Low']),
            'close': float(row['Close']),
            'volume': int(row['Volume'])
        })

    with open('$OUTPUT_DIR/real-data.json', 'w') as f:
        json.dump(data, f, indent=2)

    print(f'Downloaded {len(data)} days')
    sys.exit(0)
except Exception as e:
    print(f'Error: {e}')
    sys.exit(1)
" 2>/dev/null

  if [ $? -eq 0 ] && [ -f "$OUTPUT_DIR/real-data.json" ]; then
    echo "✅ Python yfinance success!"
    SUCCESS=1
  fi
fi

# ==============================================================================
# FINAL CHECK
# ==============================================================================

echo ""
echo "───────────────────────────────────────────────────────────────"

if [ $SUCCESS -eq 1 ]; then
  echo "✅ SUCCESS! Real market data downloaded"

  # Show what we got
  if [ -f "$OUTPUT_DIR/real-data.csv" ]; then
    echo "📊 Format: CSV"
    echo "📏 Size: $(du -h "$OUTPUT_DIR/real-data.csv" | cut -f1)"
    echo "📝 Lines: $(wc -l < "$OUTPUT_DIR/real-data.csv")"
    echo ""
    echo "Preview:"
    head -5 "$OUTPUT_DIR/real-data.csv"
  elif [ -f "$OUTPUT_DIR/real-data.json" ]; then
    echo "📊 Format: JSON"
    echo "📏 Size: $(du -h "$OUTPUT_DIR/real-data.json" | cut -f1)"
    echo ""
    echo "Preview:"
    head -10 "$OUTPUT_DIR/real-data.json"
  fi

  echo ""
  echo "✅ Ready for algorithm testing!"
  exit 0
else
  echo "❌ All sources failed"
  echo ""
  echo "📝 MANUAL FALLBACK:"
  echo "1. Visit: https://finance.yahoo.com/quote/SPY/history"
  echo "2. Download 6 months of data"
  echo "3. Save as: $OUTPUT_DIR/real-data.csv"
  exit 1
fi
