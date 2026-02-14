#!/bin/bash
# Download S&P 500 historical data (6 months) - Free and reliable

OUTPUT_FILE="/root/ankr-labs-nx/packages/vyomo-anomaly-agent/data/market-data-6months.csv"
mkdir -p "$(dirname "$OUTPUT_FILE")"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     DOWNLOADING S&P 500 DATA (6 MONTHS) - International       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Calculate dates (6 months ago to today)
END_DATE=$(date +%Y-%m-%d)
START_DATE=$(date -d "180 days ago" +%Y-%m-%d)

echo "📅 Date Range: $START_DATE to $END_DATE"
echo ""

# Try multiple free sources

echo "📥 Attempting download from marketstack.com (free tier)..."
curl -s "http://api.marketstack.com/v1/eod?access_key=demo&symbols=SPY&date_from=$START_DATE&date_to=$END_DATE" | head -20

echo ""
echo "📥 Attempting download from Alpha Vantage (free)..."

# Alpha Vantage free API
curl -s "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPY&outputsize=full&apikey=demo&datatype=csv" \
    -o "$OUTPUT_FILE"

if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
    # Check if it's valid CSV
    if head -1 "$OUTPUT_FILE" | grep -q "timestamp"; then
        # Filter to last 6 months
        awk -F',' -v start="$START_DATE" 'NR==1 || $1 >= start' "$OUTPUT_FILE" > "${OUTPUT_FILE}.filtered"
        mv "${OUTPUT_FILE}.filtered" "$OUTPUT_FILE"

        lines=$(wc -l < "$OUTPUT_FILE")
        echo "✅ Successfully downloaded: $lines rows"
        echo "💾 Saved to: $OUTPUT_FILE"
        echo ""
        echo "📊 Preview:"
        head -10 "$OUTPUT_FILE"
        exit 0
    fi
fi

echo "⚠️  Alpha Vantage failed, trying Twelve Data..."

# Try Twelve Data (no API key needed)
curl -s "https://api.twelvedata.com/time_series?symbol=SPY&interval=1day&outputsize=180&format=CSV" \
    -o "$OUTPUT_FILE"

if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
    if head -1 "$OUTPUT_FILE" | grep -q "datetime"; then
        lines=$(wc -l < "$OUTPUT_FILE")
        echo "✅ Successfully downloaded: $lines rows"
        echo "💾 Saved to: $OUTPUT_FILE"
        echo ""
        echo "📊 Preview:"
        head -10 "$OUTPUT_FILE"
        exit 0
    fi
fi

echo ""
echo "❌ Automated download failed."
echo ""
echo "📝 MANUAL DOWNLOAD INSTRUCTIONS:"
echo "───────────────────────────────────────────────────────────────"
echo "1. Visit: https://finance.yahoo.com/quote/SPY/history"
echo "2. Set date range: Last 6 months"
echo "3. Click 'Download' button"
echo "4. Save file as: $OUTPUT_FILE"
echo ""
echo "OR use this curl command with your Yahoo session cookies:"
echo "curl 'https://query1.finance.yahoo.com/v7/finance/download/SPY?period1=$(date -d '180 days ago' +%s)&period2=$(date +%s)&interval=1d&events=history' -o $OUTPUT_FILE"
echo ""
