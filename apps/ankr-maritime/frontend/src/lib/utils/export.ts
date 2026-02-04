/**
 * Export Utilities
 *
 * Handles exporting arrival data to various formats:
 * - CSV/Excel for spreadsheet analysis
 * - PDF for Pre-Departure Advisory (PDA)
 * - JSON for data integration
 */

/**
 * Export arrivals to CSV format
 */
export function exportToCSV(arrivals: any[], filename: string = 'arrivals.csv') {
  // Define CSV headers
  const headers = [
    'Vessel Name',
    'IMO',
    'Vessel Type',
    'Port',
    'UNLOCODE',
    'Status',
    'ETA',
    'Distance (NM)',
    'ETA Confidence',
    'Compliance Score',
    'Documents Required',
    'Documents Missing',
    'DA Estimate (USD)',
    'Congestion Status',
    'Vessels in Port',
    'Expected Wait (hours)'
  ];

  // Convert arrivals to CSV rows
  const rows = arrivals.map((arrival) => {
    const intelligence = arrival.intelligence || {};
    return [
      arrival.vessel.name,
      arrival.vessel.imo || '',
      arrival.vessel.type || '',
      arrival.port.name,
      arrival.port.unlocode,
      arrival.status,
      new Date(arrival.eta).toLocaleString(),
      arrival.distance?.toFixed(1) || '',
      arrival.etaConfidence || '',
      intelligence.complianceScore || 0,
      intelligence.documentsRequired || 0,
      intelligence.documentsMissing || 0,
      intelligence.daEstimate?.toFixed(2) || '',
      intelligence.congestionStatus || '',
      intelligence.vesselsInPort || '',
      intelligence.expectedWaitTimeMax || ''
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export arrivals to JSON format
 */
export function exportToJSON(arrivals: any[], filename: string = 'arrivals.json') {
  const jsonContent = JSON.stringify(arrivals, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate Pre-Departure Advisory (PDA) as HTML
 * This would be converted to PDF server-side in production
 */
export function generatePDA(arrival: any): string {
  const intelligence = arrival.intelligence || {};
  const vessel = arrival.vessel;
  const port = arrival.port;
  const eta = new Date(arrival.eta);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pre-Departure Advisory - ${vessel.name}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 3px solid #0066cc;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      color: #0066cc;
      font-size: 24px;
    }
    .section {
      margin: 20px 0;
      page-break-inside: avoid;
    }
    .section h2 {
      background: #f0f0f0;
      padding: 10px;
      border-left: 4px solid #0066cc;
      margin: 10px 0;
      font-size: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 14px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background: #f0f0f0;
      font-weight: bold;
    }
    .status-green { color: #16a34a; font-weight: bold; }
    .status-yellow { color: #ca8a04; font-weight: bold; }
    .status-red { color: #dc2626; font-weight: bold; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      font-size: 12px;
      color: #666;
    }

    /* Mobile Responsive Styles */
    @media (max-width: 640px) {
      body {
        padding: 12px;
      }
      .header h1 {
        font-size: 20px;
      }
      .header p {
        font-size: 12px;
      }
      .section h2 {
        font-size: 16px;
        padding: 8px;
      }
      table {
        font-size: 12px;
      }
      th, td {
        padding: 6px 4px;
        word-break: break-word;
      }
      /* Stack table cells on very small screens */
      @media (max-width: 400px) {
        table, thead, tbody, th, td, tr {
          display: block;
        }
        thead tr {
          display: none;
        }
        td {
          position: relative;
          padding-left: 40%;
          border: none;
          border-bottom: 1px solid #ddd;
        }
        td:before {
          position: absolute;
          left: 6px;
          content: attr(data-label);
          font-weight: bold;
        }
      }
    }

    /* Print Styles */
    @media print {
      body {
        padding: 0;
      }
      .header {
        border-bottom: 2px solid #000;
      }
      .section h2 {
        background: none;
        border-left: 3px solid #000;
      }
      @page {
        margin: 1cm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Pre-Departure Advisory</h1>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Reference:</strong> PDA-${arrival.arrivalId?.substring(0, 8)}</p>
  </div>

  <div class="section">
    <h2>Vessel Information</h2>
    <table>
      <tr><th>Vessel Name</th><td>${vessel.name}</td></tr>
      <tr><th>IMO Number</th><td>${vessel.imo || 'N/A'}</td></tr>
      <tr><th>Vessel Type</th><td>${vessel.type || 'N/A'}</td></tr>
      <tr><th>Flag</th><td>${vessel.flag || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Port & ETA</h2>
    <table>
      <tr><th>Port of Call</th><td>${port.name}</td></tr>
      <tr><th>UNLOCODE</th><td>${port.unlocode}</td></tr>
      <tr><th>ETA (Most Likely)</th><td>${eta.toLocaleString()}</td></tr>
      <tr><th>ETA Confidence</th><td>${arrival.etaConfidence || 'N/A'}</td></tr>
      <tr><th>Distance to Port</th><td>${arrival.distance?.toFixed(1) || 'N/A'} NM</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Document Requirements</h2>
    <p><strong>Compliance Score:</strong> <span class="status-${intelligence.complianceScore >= 80 ? 'green' : intelligence.complianceScore >= 50 ? 'yellow' : 'red'}">${intelligence.complianceScore || 0}%</span></p>
    <table>
      <tr><th>Required Documents</th><td>${intelligence.documentsRequired || 0}</td></tr>
      <tr><th>Documents Missing</th><td>${intelligence.documentsMissing || 0}</td></tr>
      <tr><th>Documents Submitted</th><td>${intelligence.documentsSubmitted || 0}</td></tr>
      <tr><th>Documents Approved</th><td>${intelligence.documentsApproved || 0}</td></tr>
    </table>
    ${intelligence.criticalDocsMissing > 0 ? `
    <p><strong style="color: #dc2626;">⚠️ ${intelligence.criticalDocsMissing} critical documents missing!</strong></p>
    ` : ''}
  </div>

  <div class="section">
    <h2>Port Charges Estimate</h2>
    <table>
      <tr><th>Estimated Total</th><td><strong>$${(intelligence.daEstimate || 0).toLocaleString()}</strong></td></tr>
      <tr><th>Confidence Level</th><td>${((intelligence.daConfidence || 0) * 100).toFixed(0)}%</td></tr>
      <tr><th>Estimate Range</th><td>$${(intelligence.daEstimateMin || 0).toLocaleString()} - $${(intelligence.daEstimateMax || 0).toLocaleString()}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Port Congestion Status</h2>
    <p><strong>Status:</strong> <span class="status-${intelligence.congestionStatus === 'GREEN' ? 'green' : intelligence.congestionStatus === 'YELLOW' ? 'yellow' : 'red'}">${intelligence.congestionStatus || 'UNKNOWN'}</span></p>
    <table>
      <tr><th>Vessels in Port</th><td>${intelligence.vesselsInPort || 'N/A'}</td></tr>
      <tr><th>Vessels at Anchorage</th><td>${intelligence.vesselsAtAnchorage || 'N/A'}</td></tr>
      <tr><th>Expected Wait Time</th><td>${intelligence.expectedWaitTimeMin || 0} - ${intelligence.expectedWaitTimeMax || 0} hours</td></tr>
      <tr><th>Berth Availability</th><td>${intelligence.berthAvailability || 'N/A'}</td></tr>
      <tr><th>Pilot Availability</th><td>${intelligence.pilotAvailability || 'N/A'}</td></tr>
    </table>
  </div>

  ${intelligence.recommendations ? `
  <div class="section">
    <h2>Recommendations</h2>
    <p>${typeof intelligence.recommendations === 'string' ? intelligence.recommendations : JSON.stringify(intelligence.recommendations)}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Generated by Mari8X Intelligence Engine</strong></p>
    <p>This advisory is based on real-time AIS data and predictive intelligence. Information is subject to change.</p>
    <p>For questions or updates, please contact your port agent.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Export PDA as HTML file (for printing or saving)
 */
export function exportPDAAsHTML(arrival: any, filename?: string) {
  const html = generatePDA(arrival);
  const blob = new Blob([html], { type: 'text/html' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const vesselName = arrival.vessel.name.replace(/[^a-z0-9]/gi, '_');
  const defaultFilename = `PDA_${vesselName}_${new Date().toISOString().split('T')[0]}.html`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename || defaultFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Print PDA (opens print dialog)
 */
export function printPDA(arrival: any) {
  const html = generatePDA(arrival);
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }
}

/**
 * Copy arrival data to clipboard as formatted text
 */
export async function copyToClipboard(arrival: any) {
  const text = `
Vessel: ${arrival.vessel.name} (IMO: ${arrival.vessel.imo || 'N/A'})
Port: ${arrival.port.name} (${arrival.port.unlocode})
ETA: ${new Date(arrival.eta).toLocaleString()}
Status: ${arrival.status}
Compliance: ${arrival.intelligence?.complianceScore || 0}%
DA Estimate: $${(arrival.intelligence?.daEstimate || 0).toLocaleString()}
Congestion: ${arrival.intelligence?.congestionStatus || 'UNKNOWN'}
  `.trim();

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Generate email body for master alert
 */
export function generateMasterEmail(arrival: any): { subject: string; body: string } {
  const vessel = arrival.vessel;
  const port = arrival.port;
  const eta = new Date(arrival.eta);
  const intelligence = arrival.intelligence || {};

  const subject = `Pre-Arrival Advisory: ${vessel.name} → ${port.name}`;

  const body = `
Dear Master,

This is your pre-arrival advisory for ${port.name} (${port.unlocode}).

VESSEL DETAILS:
- Vessel: ${vessel.name}
- IMO: ${vessel.imo || 'N/A'}
- ETA: ${eta.toLocaleString()}
- Distance: ${arrival.distance?.toFixed(1) || 'N/A'} NM

DOCUMENT STATUS:
- Compliance: ${intelligence.complianceScore || 0}%
- Documents Required: ${intelligence.documentsRequired || 0}
- Documents Missing: ${intelligence.documentsMissing || 0}
${intelligence.criticalDocsMissing > 0 ? `- ⚠️ ${intelligence.criticalDocsMissing} CRITICAL DOCUMENTS MISSING\n` : ''}

PORT CHARGES ESTIMATE:
- Estimated Total: $${(intelligence.daEstimate || 0).toLocaleString()}
- Range: $${(intelligence.daEstimateMin || 0).toLocaleString()} - $${(intelligence.daEstimateMax || 0).toLocaleString()}

PORT CONGESTION:
- Status: ${intelligence.congestionStatus || 'UNKNOWN'}
- Expected Wait: ${intelligence.expectedWaitTimeMin || 0}-${intelligence.expectedWaitTimeMax || 0} hours
- Vessels in Port: ${intelligence.vesselsInPort || 'N/A'}

${intelligence.recommendations ? `RECOMMENDATIONS:\n${typeof intelligence.recommendations === 'string' ? intelligence.recommendations : JSON.stringify(intelligence.recommendations)}\n` : ''}

Please review and prepare accordingly.

Best regards,
Port Agency Team

---
Generated by Mari8X Intelligence Engine
  `.trim();

  return { subject, body };
}
