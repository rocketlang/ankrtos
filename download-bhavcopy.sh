#!/bin/bash
# Download NSE Bhavcopy (End-of-Day official data) for last 6 months

OUTPUT_DIR="/root/ankr-labs-nx/packages/vyomo-anomaly-agent/data/bhavcopy"
mkdir -p "$OUTPUT_DIR"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       DOWNLOADING NSE BHAVCOPY (EOD DATA - 6 MONTHS)          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Function to download bhavcopy for a specific date
download_bhavcopy() {
    local date=$1
    local day=$(date -d "$date" +%d)
    local mon_upper=$(date -d "$date" +%b | tr '[:lower:]' '[:upper:]')
    local mon_lower=$(date -d "$date" +%b | tr '[:upper:]' '[:lower:]')
    local year=$(date -d "$date" +%Y)
    local date_formatted=$(date -d "$date" +%d%m%Y)

    # NSE Equity Bhavcopy URL format
    local url="https://archives.nseindia.com/content/historical/EQUITIES/${year}/${mon_upper}/cm${date_formatted}bhav.csv.zip"

    local filename="cm${date_formatted}bhav.csv.zip"
    local output_path="$OUTPUT_DIR/$filename"

    # Try downloading
    curl -s -f --max-time 10 \
        -H "User-Agent: Mozilla/5.0" \
        -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
        "$url" -o "$output_path"

    if [ $? -eq 0 ] && [ -f "$output_path" ]; then
        # Unzip
        unzip -q -o "$output_path" -d "$OUTPUT_DIR" 2>/dev/null
        rm "$output_path"
        echo "✓ $date"
        return 0
    else
        echo "✗ $date (no data)"
        return 1
    fi
}

# Download last 6 months (180 days)
echo "📥 Downloading bhavcopy files..."
echo ""

successful=0
failed=0

for i in $(seq 0 180); do
    date=$(date -d "$i days ago" +%Y-%m-%d)

    # Skip weekends (Saturday=6, Sunday=0)
    day_of_week=$(date -d "$date" +%u)
    if [ $day_of_week -eq 6 ] || [ $day_of_week -eq 7 ]; then
        continue
    fi

    if download_bhavcopy "$date"; then
        ((successful++))
    else
        ((failed++))
    fi

    # Rate limiting
    sleep 0.5
done

echo ""
echo "───────────────────────────────────────────────────────────────"
echo "✅ Successfully downloaded: $successful files"
echo "❌ Failed/Missing:          $failed files"
echo "💾 Saved to: $OUTPUT_DIR"
echo ""

# Count CSV files
csv_count=$(ls -1 "$OUTPUT_DIR"/*.CSV 2>/dev/null | wc -l)
echo "📊 Total CSV files: $csv_count"

if [ $csv_count -gt 50 ]; then
    echo "✅ Sufficient data downloaded!"
    echo ""
    echo "🔍 Sample files:"
    ls -1 "$OUTPUT_DIR"/*.CSV | head -5
else
    echo "⚠️  Less data than expected"
fi

echo ""
