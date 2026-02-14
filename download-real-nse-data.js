/**
 * Download REAL NSE Historical Data (6 months)
 * Using reliable data sources
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ==============================================================================
// DATA SOURCES (Multiple fallbacks)
// ==============================================================================

async function downloadFromYahooFinance() {
  console.log('\n📥 Downloading from Yahoo Finance...');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 6); // 6 months

  const start = Math.floor(startDate.getTime() / 1000);
  const end = Math.floor(endDate.getTime() / 1000);

  // Yahoo Finance download URL for NIFTY 50
  const url = `https://query1.finance.yahoo.com/v7/finance/download/%5ENSEI?period1=${start}&period2=${end}&interval=1d&events=history&includeAdjustedClose=true`;

  try {
    const csv = await fetchURL(url);

    if (csv.includes('Date,Open,High,Low,Close')) {
      const data = parseYahooCSV(csv);
      console.log(`✅ Yahoo Finance: Downloaded ${data.length} days`);
      return data;
    }
  } catch (error) {
    console.log(`❌ Yahoo Finance failed: ${error.message}`);
  }

  return null;
}

async function downloadFromAlphaVantage() {
  console.log('\n📥 Downloading from Alpha Vantage...');

  // Free API key (demo - replace with real key if needed)
  const apiKey = 'demo';
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=NSEI&outputsize=full&apikey=${apiKey}&datatype=csv`;

  try {
    const csv = await fetchURL(url);

    if (csv.includes('timestamp,open,high,low,close')) {
      const data = parseAlphaVantageCSV(csv);
      const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
      const filtered = data.filter(d => new Date(d.date).getTime() > sixMonthsAgo);

      console.log(`✅ Alpha Vantage: Downloaded ${filtered.length} days`);
      return filtered;
    }
  } catch (error) {
    console.log(`❌ Alpha Vantage failed: ${error.message}`);
  }

  return null;
}

async function downloadFromTwelveData() {
  console.log('\n📥 Downloading from Twelve Data...');

  // Free API (no key needed for basic access)
  const url = `https://api.twelvedata.com/time_series?symbol=NSEI&interval=1day&outputsize=180&format=JSON`;

  try {
    const response = await fetchURL(url);
    const json = JSON.parse(response);

    if (json.values && Array.isArray(json.values)) {
      const data = json.values.map(item => ({
        date: item.datetime,
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume || 0)
      })).reverse(); // Oldest first

      console.log(`✅ Twelve Data: Downloaded ${data.length} days`);
      return data;
    }
  } catch (error) {
    console.log(`❌ Twelve Data failed: ${error.message}`);
  }

  return null;
}

async function downloadFromNSEIndiaDirect() {
  console.log('\n📥 Trying NSE India direct download...');

  // Try to download the CSV file directly
  const url = 'https://www.nseindia.com/api/historical/cm/equity?symbol=NIFTY&series=%5B%22EQ%22%5D&from=01-08-2025&to=13-02-2026';

  try {
    const response = await fetchURL(url, {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.nseindia.com/',
      'Origin': 'https://www.nseindia.com'
    });

    const json = JSON.parse(response);

    if (json.data && Array.isArray(json.data)) {
      const data = json.data.map(item => ({
        date: item.CH_TIMESTAMP,
        open: parseFloat(item.CH_OPENING_PRICE),
        high: parseFloat(item.CH_TRADE_HIGH_PRICE),
        low: parseFloat(item.CH_TRADE_LOW_PRICE),
        close: parseFloat(item.CH_CLOSING_PRICE),
        volume: parseFloat(item.CH_TOT_TRADED_QTY)
      }));

      console.log(`✅ NSE India: Downloaded ${data.length} days`);
      return data;
    }
  } catch (error) {
    console.log(`❌ NSE India failed: ${error.message}`);
  }

  return null;
}

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

function fetchURL(url, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        ...customHeaders
      }
    };

    https.get(url, options, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchURL(res.headers.location, customHeaders).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseYahooCSV(csv) {
  const lines = csv.trim().split('\n');
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 6 && parts[0] !== 'null') {
      data.push({
        date: parts[0],
        open: parseFloat(parts[1]),
        high: parseFloat(parts[2]),
        low: parseFloat(parts[3]),
        close: parseFloat(parts[4]),
        volume: parseFloat(parts[6] || parts[5])
      });
    }
  }

  return data;
}

function parseAlphaVantageCSV(csv) {
  const lines = csv.trim().split('\n');
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 5) {
      data.push({
        date: parts[0],
        open: parseFloat(parts[1]),
        high: parseFloat(parts[2]),
        low: parseFloat(parts[3]),
        close: parseFloat(parts[4]),
        volume: parseFloat(parts[5] || 0)
      });
    }
  }

  return data;
}

// ==============================================================================
// MAIN
// ==============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║       DOWNLOADING REAL NSE/NIFTY DATA (6 MONTHS)              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  let data = null;

  // Try all sources in order
  const sources = [
    downloadFromYahooFinance,
    downloadFromTwelveData,
    downloadFromAlphaVantage,
    downloadFromNSEIndiaDirect
  ];

  for (const source of sources) {
    data = await source();
    if (data && data.length > 100) {
      break; // Success!
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between attempts
  }

  if (!data || data.length < 100) {
    console.log('\n❌ Could not download data from any source');
    console.log('\n📝 Manual Download Instructions:');
    console.log('1. Visit: https://in.finance.yahoo.com/quote/%5ENSEI/history');
    console.log('2. Select "6M" (6 months) time period');
    console.log('3. Click "Download" button');
    console.log('4. Save as: /root/ankr-labs-nx/packages/vyomo-anomaly-agent/data/nifty-6m.csv');
    console.log('5. Run: node analyze-with-real-data.js\n');
    process.exit(1);
  }

  // Save to file
  const outputDir = path.join(__dirname, 'ankr-labs-nx/packages/vyomo-anomaly-agent/data');
  const outputPath = path.join(outputDir, 'nifty-real-6months.json');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`\n✅ SUCCESS! Downloaded ${data.length} days of REAL market data`);
  console.log(`💾 Saved to: ${outputPath}\n`);

  // Show summary
  console.log('📊 DATA SUMMARY');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`Total Days:     ${data.length}`);
  console.log(`Date Range:     ${data[0].date} → ${data[data.length - 1].date}`);

  const prices = data.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  console.log(`Price Range:    ₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`);
  console.log(`Average Price:  ₹${avgPrice.toFixed(2)}`);
  console.log(`Volatility:     ${((maxPrice - minPrice) / avgPrice * 100).toFixed(2)}%`);

  if (data.some(d => d.volume > 0)) {
    const avgVolume = data.filter(d => d.volume > 0).reduce((sum, d) => sum + d.volume, 0) / data.filter(d => d.volume > 0).length;
    console.log(`Avg Volume:     ${(avgVolume / 1000000).toFixed(2)}M`);
  }

  console.log('\n🔍 Sample Data (first 5 days):');
  data.slice(0, 5).forEach(d => {
    const vol = d.volume > 0 ? ` Vol: ${(d.volume / 1000000).toFixed(2)}M` : '';
    console.log(`${d.date}  Open: ₹${d.open.toFixed(2)}  Close: ₹${d.close.toFixed(2)}${vol}`);
  });

  console.log('\n✅ Real data ready for analysis!');
  console.log('🚀 Next step: node analyze-with-real-data.js\n');
}

main().catch(console.error);
