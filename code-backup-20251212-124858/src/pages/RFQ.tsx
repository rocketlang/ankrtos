import { useState } from 'react';
import * as XLSX from 'xlsx';

const SAATHI_API = 'http://localhost:4002';

interface RfqLine {
  lineNo: number;
  source: string;
  destination: string;
  sourceZip: string;
  destZip: string;
  truckType: string;
  baseRate: number;
  distance: number;
  tollCalibrated: number;
  transitDays: number;
  confidence: number;
  region: string;
  status: 'preview' | 'loaded' | 'calculating' | 'calculated' | 'error';
  error?: string;
}

export default function RFQ() {
  const [lines, setLines] = useState<RfqLine[]>([]);
  const [fileName, setFileName] = useState('');
  const [stage, setStage] = useState<'empty' | 'preview' | 'ready' | 'processing' | 'done'>('empty');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      
      const parsed: RfqLine[] = json.map((row: any, i) => ({
        lineNo: i + 1,
        source: row['Source*'] || row['Source'] || row['origin_city'] || '',
        destination: row['Destination*'] || row['Destination'] || row['destination_city'] || '',
        sourceZip: String(row['Source Zip Code'] || row['origin_pincode'] || ''),
        destZip: String(row['Destination Zip Code'] || row['destination_pincode'] || ''),
        truckType: row['Truck Type'] || row['vehicle_type'] || '',
        baseRate: Number(row['Base Rate (INR)'] || row['base_rate'] || 0),
        distance: Number(row['Distance_KM'] || row['distance_km'] || 0),
        tollCalibrated: Number(row['Toll_Calibrated'] || row['toll_estimate'] || 0),
        transitDays: Number(row['Transit Time (Days)'] || row['transit_days'] || 0),
        confidence: Number(row['Toll_Confidence'] || 0),
        region: row['Region'] || '',
        status: 'preview'
      }));
      
      setLines(parsed);
      setStage('preview');
    };
    reader.readAsBinaryString(file);
  };

  // Preview first 10 rows to validate
  const validatePreview = () => {
    const preview = lines.slice(0, 10);
    const valid = preview.filter(l => l.source && l.destination).length;
    if (valid >= 5) {
      // Mark all as loaded, ready for processing
      setLines(lines.map(l => ({ ...l, status: 'loaded' })));
      setStage('ready');
    } else {
      alert('File validation failed. Need at least 5 valid rows with Source and Destination.');
    }
  };

  // Process rows that need distance/toll calculation
  const processAll = async () => {
    setProcessing(true);
    setStage('processing');
    const updated = [...lines];
    
    // Find rows that need calculation (missing distance or toll)
    const needsCalc = updated.filter(l => !l.distance || !l.tollCalibrated);
    
    if (needsCalc.length === 0) {
      // All data already present
      setLines(updated.map(l => ({ ...l, status: 'calculated' })));
      setStage('done');
      setProcessing(false);
      return;
    }

    let processed = 0;
    for (let i = 0; i < updated.length; i++) {
      const line = updated[i];
      
      // Skip if already has distance and toll
      if (line.distance > 0 && line.tollCalibrated > 0) {
        updated[i] = { ...line, status: 'calculated' };
        continue;
      }

      updated[i] = { ...line, status: 'calculating' };
      setLines([...updated]);
      setProgress(Math.round((processed / needsCalc.length) * 100));

      try {
        // Try to calculate using pincodes
        if (line.sourceZip && line.destZip) {
          const routeRes = await fetch(
            `${SAATHI_API}/api/route/coords?from_pin=${line.sourceZip}&to_pin=${line.destZip}`
          );
          const routeData = await routeRes.json();
          
          if (routeData.distance_km) {
            updated[i] = {
              ...line,
              distance: routeData.distance_km || line.distance,
              tollCalibrated: routeData.toll_estimate || line.tollCalibrated,
              confidence: routeData.confidence || line.confidence,
              status: 'calculated'
            };
          } else {
            updated[i] = { ...line, status: 'calculated' }; // Keep existing data
          }
        } else {
          updated[i] = { ...line, status: 'calculated' };
        }
      } catch (err) {
        updated[i] = { ...line, status: 'error', error: 'API error' };
      }
      
      processed++;
      setLines([...updated]);
      await new Promise(r => setTimeout(r, 100)); // Rate limit
    }
    
    setProcessing(false);
    setStage('done');
    setProgress(100);
  };

  const exportResults = () => {
    const ws = XLSX.utils.json_to_sheet(lines.map(l => ({
      '#': l.lineNo,
      'Source': l.source,
      'Destination': l.destination,
      'Source PIN': l.sourceZip,
      'Dest PIN': l.destZip,
      'Truck Type': l.truckType,
      'Distance (km)': l.distance.toFixed(1),
      'Base Rate': l.baseRate,
      'Toll': l.tollCalibrated,
      'Total': l.baseRate + l.tollCalibrated,
      'Transit Days': l.transitDays,
      'Confidence': `${(l.confidence * 100).toFixed(0)}%`,
      'Region': l.region,
      'Status': l.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RFQ Results');
    XLSX.writeFile(wb, 'rfq_export.xlsx');
  };

  const resetFile = () => {
    setLines([]);
    setFileName('');
    setStage('empty');
    setProgress(0);
  };

  // Stats
  const loaded = lines.filter(l => l.distance > 0).length;
  const needsCalc = lines.filter(l => !l.distance || !l.tollCalibrated).length;
  const totalDistance = lines.reduce((sum, l) => sum + l.distance, 0);
  const totalBaseRate = lines.reduce((sum, l) => sum + l.baseRate, 0);
  const totalToll = lines.reduce((sum, l) => sum + l.tollCalibrated, 0);
  const avgConfidence = lines.length > 0 
    ? lines.reduce((sum, l) => sum + l.confidence, 0) / lines.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📋 RFQ Batch Processor</h1>
        <div className="flex gap-2">
          {stage !== 'empty' && (
            <button onClick={resetFile} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
              🔄 New File
            </button>
          )}
          {stage === 'done' && (
            <button onClick={exportResults} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              📥 Export Results
            </button>
          )}
        </div>
      </div>

      {/* Upload Card */}
      {stage === 'empty' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Step 1: Upload Excel File</h2>
          <p className="text-sm text-gray-500 mb-4">
            Supports MRF format with columns: Source*, Destination*, Source Zip Code, Base Rate (INR), Distance_KM, Toll_Calibrated
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>
      )}

      {/* Preview Stage */}
      {stage === 'preview' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Step 2: Preview & Validate</h2>
          <p className="text-sm text-gray-600 mb-4">
            ✅ Loaded <strong>{fileName}</strong> with <strong>{lines.length}</strong> rows. 
            Showing first 10 rows for preview.
          </p>
          <button onClick={validatePreview} className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700">
            ✅ Validate & Continue
          </button>
        </div>
      )}

      {/* Ready to Process */}
      {stage === 'ready' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Step 3: Process File</h2>
          <p className="text-sm text-gray-600 mb-4">
            📊 <strong>{lines.length}</strong> lanes ready. 
            <strong className="text-green-600"> {loaded}</strong> have complete data. 
            <strong className="text-orange-600"> {needsCalc}</strong> need distance/toll calculation.
          </p>
          <button onClick={processAll} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            🚀 Process All ({needsCalc > 0 ? `Calculate ${needsCalc} missing` : 'Finalize'})
          </button>
        </div>
      )}

      {/* Processing */}
      {stage === 'processing' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Processing... {progress}%</h2>
          <div className="bg-gray-200 rounded-full h-3 mb-4">
            <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-gray-500">Calculating distances and tolls for missing lanes...</p>
        </div>
      )}

      {/* Stats */}
      {lines.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{lines.length}</p>
            <p className="text-sm text-gray-500">Total Lanes</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{loaded}</p>
            <p className="text-sm text-gray-500">With Data</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{(totalDistance/1000).toFixed(0)}K km</p>
            <p className="text-sm text-gray-500">Total Distance</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">₹{(totalBaseRate/10000000).toFixed(1)}Cr</p>
            <p className="text-sm text-gray-500">Total Base Rate</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">₹{(totalToll/100000).toFixed(1)}L</p>
            <p className="text-sm text-gray-500">Total Toll</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{(avgConfidence * 100).toFixed(0)}%</p>
            <p className="text-sm text-gray-500">Avg Confidence</p>
          </div>
        </div>
      )}

      {/* Results Table */}
      {lines.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto max-h-[500px]">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left">#</th>
                  <th className="px-3 py-3 text-left">Source</th>
                  <th className="px-3 py-3 text-left">Destination</th>
                  <th className="px-3 py-3 text-left">Truck</th>
                  <th className="px-3 py-3 text-right">Distance</th>
                  <th className="px-3 py-3 text-right">Base Rate</th>
                  <th className="px-3 py-3 text-right">Toll</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3 text-center">Conf</th>
                  <th className="px-3 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(stage === 'preview' ? lines.slice(0, 10) : lines).map((line) => (
                  <tr key={line.lineNo} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{line.lineNo}</td>
                    <td className="px-3 py-2 font-medium max-w-[180px] truncate" title={line.source}>{line.source}</td>
                    <td className="px-3 py-2 max-w-[120px] truncate" title={line.destination}>{line.destination}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 max-w-[80px] truncate">{line.truckType}</td>
                    <td className="px-3 py-2 text-right">{line.distance > 0 ? `${line.distance.toFixed(0)} km` : '-'}</td>
                    <td className="px-3 py-2 text-right text-green-600 font-medium">
                      {line.baseRate > 0 ? `₹${line.baseRate.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right text-orange-600">
                      {line.tollCalibrated > 0 ? `₹${line.tollCalibrated.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-bold">
                      {line.baseRate > 0 ? `₹${(line.baseRate + line.tollCalibrated).toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {line.confidence > 0 ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          line.confidence >= 0.7 ? 'bg-green-100 text-green-800' :
                          line.confidence >= 0.4 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(line.confidence * 100).toFixed(0)}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        line.status === 'calculated' ? 'bg-green-100 text-green-800' :
                        line.status === 'calculating' ? 'bg-blue-100 text-blue-800' :
                        line.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {line.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stage === 'preview' && lines.length > 10 && (
            <div className="bg-gray-50 px-4 py-2 text-sm text-gray-500 text-center">
              Showing 10 of {lines.length} rows. Click "Validate & Continue" to see all.
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {stage === 'empty' && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-lg font-semibold text-gray-700">No file loaded</h3>
          <p className="text-gray-500 mt-2">Upload an MRF Excel file to view and process lanes</p>
          <p className="text-sm text-gray-400 mt-4">
            Sample file: ~/ankr-labs-nx/assets/wowtruck-legacy/MRF_RFQ_CALIBRATED_TOLLS.xlsx
          </p>
        </div>
      )}
    </div>
  );
}
