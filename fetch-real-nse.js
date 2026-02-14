/**
 * Fetch REAL NSE Historical Data
 * Multiple fallback sources
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ==============================================================================
// DATA SOURCES
// ==============================================================================

async function fetchFromYahooFinance() {
  console.log('Trying Yahoo Finance...');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 1);

  const start = Math.floor(startDate.getTime() / 1000);
  const end = Math.floor(endDate.getTime() / 1000);

  const url = `https://query1.finance.yahoo.com/v7/finance/download/%5ENSEI?period1=${start}&period2=${end}&interval=1d&events=history`;

  try {
    const data = await fetchURL(url);
    const rows = parseCSV(data);

    if (rows.length > 0) {
      console.log(`✓ Yahoo: Got ${rows.length} days\n`);
      return rows.map(row => ({
        date: row.Date,
        open: parseFloat(row.Open),
        high: parseFloat(row.High),
        low: parseFloat(row.Low),
        close: parseFloat(row.Close),
        volume: parseFloat(row.Volume)
      }));
    }
  } catch (error) {
    console.log(`✗ Yahoo failed: ${error.message}`);
  }

  return null;
}

async function fetchFromNSEIndia() {
  console.log('Trying NSE India...');

  // NSE requires session cookies, try direct download
  const urls = [
    'https://www.nseindia.com/api/historical/cm/equity?symbol=NIFTY%2050',
    'https://archives.nseindia.com/products/content/equities/indices/historical_index_data.htm'
  ];

  for (const url of urls) {
    try {
      const data = await fetchURL(url);
      if (data.length > 100) {
        console.log(`✓ NSE: Got data\n`);
        return parseNSEData(data);
      }
    } catch (error) {
      console.log(`✗ NSE attempt failed`);
    }
  }

  return null;
}

async function fetchFromTiingo() {
  console.log('Trying Tiingo...');

  // Tiingo API (requires free API key)
  const apiKey = 'demo'; // Replace with real key
  const url = `https://api.tiingo.com/tiingo/daily/^NSEI/prices?startDate=2024-01-01&token=${apiKey}`;

  try {
    const data = await fetchURL(url);
    const parsed = JSON.parse(data);

    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log(`✓ Tiingo: Got ${parsed.length} days\n`);
      return parsed.map(row => ({
        date: row.date.split('T')[0],
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume
      }));
    }
  } catch (error) {
    console.log(`✗ Tiingo failed: ${error.message}`);
  }

  return null;
}

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.nseindia.com'
      }
    };

    https.get(url, options, (res) => {
      let data = '';

      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchURL(res.headers.location).then(resolve).catch(reject);
      }

      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, i) => obj[header] = values[i]);
    return obj;
  });
}

function parseNSEData(data) {
  // NSE has custom formats, try to parse
  try {
    const json = JSON.parse(data);
    if (json.data && Array.isArray(json.data)) {
      return json.data.map(row => ({
        date: row.CH_TIMESTAMP || row.date,
        open: parseFloat(row.CH_OPENING_PRICE || row.open),
        high: parseFloat(row.CH_TRADE_HIGH_PRICE || row.high),
        low: parseFloat(row.CH_TRADE_LOW_PRICE || row.low),
        close: parseFloat(row.CH_CLOSING_PRICE || row.close),
        volume: parseFloat(row.CH_TOT_TRADED_QTY || row.volume)
      }));
    }
  } catch (e) {
    // Not JSON, might be CSV
    return parseCSV(data);
  }

  return [];
}

// ==============================================================================
// MAIN
// ==============================================================================

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║          FETCHING REAL HISTORICAL NSE DATA                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  let data = null;

  // Try all sources
  data = await fetchFromYahooFinance();

  if (!data) {
    data = await fetchFromNSEIndia();
  }

  if (!data) {
    data = await fetchFromTiingo();
  }

  if (!data || data.length === 0) {
    console.log('\n❌ Could not fetch real data from any source\n');
    console.log('Alternative options:');
    console.log('1. Download NIFTY data manually from:');
    console.log('   - https://www.nseindia.com/products-services/indices-historical-data');
    console.log('   - https://in.finance.yahoo.com (download CSV)');
    console.log('   - https://www.moneycontrol.com/markets/indian-indices/');
    console.log('');
    console.log('2. Save as: data/nifty-historical.csv');
    console.log('   Format: Date,Open,High,Low,Close,Volume');
    console.log('');
    console.log('3. Then run: node analyze-algorithms.js\n');
    return;
  }

  console.log(`✅ Successfully fetched ${data.length} days of REAL data!\n`);

  // Save
  const outputDir = path.join(__dirname, 'ankr-labs-nx/packages/vyomo-anomaly-agent/data');
  const outputPath = path.join(outputDir, 'nifty-historical-real.json');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`💾 Saved to: ${outputPath}\n`);

  // Show summary
  console.log('📊 DATA SUMMARY');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`Total Days:     ${data.length}`);
  console.log(`Date Range:     ${data[0].date} to ${data[data.length-1].date}`);
  console.log(`Price Range:    ₹${Math.min(...data.map(d => d.close)).toFixed(2)} - ₹${Math.max(...data.map(d => d.close)).toFixed(2)}`);
  console.log('');

  console.log('🔍 Sample (first 5 days):');
  data.slice(0, 5).forEach(d => {
    console.log(`${d.date}  Close: ₹${d.close.toFixed(2)}  Vol: ${(d.volume/1000000).toFixed(2)}M`);
  });
  console.log('');

  console.log('✅ Real data ready!');
  console.log('🚀 Next: Run algorithm analysis on this REAL data\n');
}

main().catch(console.error);
