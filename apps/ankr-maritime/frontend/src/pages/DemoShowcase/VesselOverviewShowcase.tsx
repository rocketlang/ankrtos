import React, { useState } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface Vessel {
  id: string;
  imo: string;
  name: string;
  type: 'bulk_carrier' | 'tanker' | 'container' | 'general_cargo';
  flag: string;
  dwt: number;
  grt: number;
  loa: number;
  beam: number;
  draft: number;
  yearBuilt: number;
  status: 'active' | 'drydock' | 'layup';
  currentPosition: string;
  nextPort: string;
  eta: string;
}

interface Certificate {
  id: string;
  name: string;
  type: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  issuingAuthority: string;
}

interface Inspection {
  id: string;
  type: string;
  date: string;
  inspector: string;
  result: 'pass' | 'pass_with_deficiencies' | 'detained';
  deficiencies: number;
  location: string;
}

interface Specification {
  category: string;
  items: { label: string; value: string }[];
}

const VesselOverviewShowcase: React.FC = () => {
  const [selectedVessel, setSelectedVessel] = useState<string>('ocean-spirit');
  const [activeTab, setActiveTab] = useState<'specs' | 'certificates' | 'inspections' | 'history'>('specs');

  const vessels: Vessel[] = [
    {
      id: 'ocean-spirit',
      imo: 'IMO 9876543',
      name: 'MV OCEAN SPIRIT',
      type: 'bulk_carrier',
      flag: '🇵🇦 Panama',
      dwt: 82000,
      grt: 44250,
      loa: 229.0,
      beam: 32.26,
      draft: 14.50,
      yearBuilt: 2018,
      status: 'active',
      currentPosition: 'Singapore',
      nextPort: 'Rotterdam',
      eta: '2026-02-28',
    },
    {
      id: 'fortune-star',
      imo: 'IMO 9854321',
      name: 'MV FORTUNE STAR',
      type: 'bulk_carrier',
      flag: '🇲🇭 Marshall Islands',
      dwt: 76000,
      grt: 41800,
      loa: 225.0,
      beam: 32.20,
      draft: 14.35,
      yearBuilt: 2020,
      status: 'active',
      currentPosition: 'Shanghai',
      nextPort: 'Vancouver',
      eta: '2026-03-15',
    },
    {
      id: 'pacific-crown',
      imo: 'IMO 9765432',
      name: 'MV PACIFIC CROWN',
      type: 'bulk_carrier',
      flag: '🇱🇷 Liberia',
      dwt: 81500,
      grt: 43950,
      loa: 228.5,
      beam: 32.24,
      draft: 14.48,
      yearBuilt: 2017,
      status: 'drydock',
      currentPosition: 'Dubai Drydock',
      nextPort: 'TBD',
      eta: 'TBD',
    },
    {
      id: 'golden-bridge',
      imo: 'IMO 9712345',
      name: 'MV GOLDEN BRIDGE',
      type: 'container',
      flag: '🇸🇬 Singapore',
      dwt: 65000,
      grt: 58200,
      loa: 294.0,
      beam: 32.20,
      draft: 13.00,
      yearBuilt: 2019,
      status: 'active',
      currentPosition: 'Port Klang',
      nextPort: 'Hamburg',
      eta: '2026-03-10',
    },
  ];

  const certificates: Certificate[] = [
    {
      id: '1',
      name: 'Safety Equipment Certificate',
      type: 'SOLAS',
      issueDate: '2025-06-15',
      expiryDate: '2026-06-15',
      status: 'valid',
      issuingAuthority: 'Panama Maritime Authority',
    },
    {
      id: '2',
      name: 'Load Line Certificate',
      type: 'SOLAS',
      issueDate: '2025-06-15',
      expiryDate: '2026-06-15',
      status: 'valid',
      issuingAuthority: 'Panama Maritime Authority',
    },
    {
      id: '3',
      name: 'ISM Certificate (DOC)',
      type: 'ISM',
      issueDate: '2024-03-10',
      expiryDate: '2027-03-10',
      status: 'valid',
      issuingAuthority: 'Class NK',
    },
    {
      id: '4',
      name: 'ISM Certificate (SMC)',
      type: 'ISM',
      issueDate: '2025-09-20',
      expiryDate: '2026-09-20',
      status: 'valid',
      issuingAuthority: 'Class NK',
    },
    {
      id: '5',
      name: 'ISPS Certificate',
      type: 'ISPS',
      issueDate: '2025-08-12',
      expiryDate: '2026-08-12',
      status: 'valid',
      issuingAuthority: 'Panama Maritime Authority',
    },
    {
      id: '6',
      name: 'MLC Certificate',
      type: 'MLC',
      issueDate: '2024-11-05',
      expiryDate: '2026-11-05',
      status: 'valid',
      issuingAuthority: 'Panama Maritime Authority',
    },
    {
      id: '7',
      name: 'Class Certificate',
      type: 'Classification',
      issueDate: '2023-04-18',
      expiryDate: '2028-04-18',
      status: 'valid',
      issuingAuthority: 'Class NK',
    },
    {
      id: '8',
      name: 'P&I Certificate',
      type: 'Insurance',
      issueDate: '2026-02-01',
      expiryDate: '2027-02-01',
      status: 'valid',
      issuingAuthority: 'UK P&I Club',
    },
  ];

  const inspections: Inspection[] = [
    {
      id: '1',
      type: 'Port State Control',
      date: '2026-01-15',
      inspector: 'Singapore MPA',
      result: 'pass',
      deficiencies: 0,
      location: 'Singapore',
    },
    {
      id: '2',
      type: 'Flag State Inspection',
      date: '2025-12-08',
      inspector: 'Panama Maritime Authority',
      result: 'pass',
      deficiencies: 0,
      location: 'Port Hedland',
    },
    {
      id: '3',
      type: 'Class Annual Survey',
      date: '2025-10-22',
      inspector: 'Class NK Surveyor',
      result: 'pass',
      deficiencies: 0,
      location: 'Shanghai',
    },
    {
      id: '4',
      type: 'Port State Control',
      date: '2025-09-14',
      inspector: 'Australian AMSA',
      result: 'pass_with_deficiencies',
      deficiencies: 2,
      location: 'Newcastle',
    },
    {
      id: '5',
      type: 'Vetting Inspection (SIRE)',
      date: '2025-08-30',
      inspector: 'Oil Major Inspector',
      result: 'pass',
      deficiencies: 0,
      location: 'Rotterdam',
    },
  ];

  const specifications: Specification[] = [
    {
      category: 'Identification',
      items: [
        { label: 'IMO Number', value: 'IMO 9876543' },
        { label: 'Official Number', value: '45678-PEXT-9' },
        { label: 'Call Sign', value: '3FMK7' },
        { label: 'MMSI', value: '371234000' },
      ],
    },
    {
      category: 'Dimensions',
      items: [
        { label: 'Length Overall (LOA)', value: '229.00 m' },
        { label: 'Breadth Moulded', value: '32.26 m' },
        { label: 'Depth', value: '18.30 m' },
        { label: 'Draft (Design)', value: '14.50 m' },
        { label: 'Draft (Scantling)', value: '16.10 m' },
      ],
    },
    {
      category: 'Tonnage',
      items: [
        { label: 'Deadweight (DWT)', value: '82,000 MT' },
        { label: 'Gross Tonnage (GT)', value: '44,250' },
        { label: 'Net Tonnage (NT)', value: '24,380' },
        { label: 'Displacement', value: '96,500 MT' },
      ],
    },
    {
      category: 'Cargo',
      items: [
        { label: 'Cargo Holds', value: '5 holds' },
        { label: 'Grain Capacity', value: '98,450 m³' },
        { label: 'Bale Capacity', value: '94,230 m³' },
        { label: 'Hatch Covers', value: 'Hydraulic folding' },
      ],
    },
    {
      category: 'Machinery',
      items: [
        { label: 'Main Engine', value: 'MAN B&W 6S50ME-C' },
        { label: 'Power Output', value: '9,480 kW' },
        { label: 'Service Speed', value: '14.5 knots' },
        { label: 'Fuel Type', value: 'VLSFO / LSMGO' },
      ],
    },
    {
      category: 'Classification',
      items: [
        { label: 'Class Society', value: 'Nippon Kaiji Kyokai (Class NK)' },
        { label: 'Class Notation', value: 'NS* (BC-A, Grab[25], ESP, SHIPHALT-NBS, NAUT-AW, SCM)' },
        { label: 'Ice Class', value: 'None' },
      ],
    },
  ];

  const vesselTypeLabels: Record<string, string> = {
    bulk_carrier: 'Bulk Carrier',
    tanker: 'Tanker',
    container: 'Container',
    general_cargo: 'General Cargo',
  };

  const selectedVesselData = vessels.find((v) => v.id === selectedVessel) || vessels[0];

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-green-900/30 text-green-400 border-green-500/50';
    if (status === 'drydock') return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50';
    return 'bg-gray-800 text-gray-400 border-gray-600';
  };

  const getCertificateStatusColor = (status: string) => {
    if (status === 'valid') return 'text-green-400 bg-green-900/30';
    if (status === 'expiring_soon') return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
  };

  const getInspectionResultColor = (result: string) => {
    if (result === 'pass') return 'text-green-400 bg-green-900/30';
    if (result === 'pass_with_deficiencies') return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
  };

  return (
    <ShowcaseLayout
      title="Vessel Overview"
      icon="🚢"
      category="Fleet Management"
      problem="Vessel data scattered across Excel sheets, PDFs, and classification society portals - making it impossible to get a complete vessel profile, track certificate renewals, or respond quickly to vetting requests."
      solution="Centralized vessel registry with complete technical specifications, certificate tracking with auto-renewal alerts, inspection history, and instant vetting profile generation - reducing vetting preparation time from 4 hours to 5 minutes."
      timeSaved="4 hours → 5 min"
      roi="35x"
      accuracy="100% data completeness"
      nextSection={{
        title: 'Technical Operations',
        path: '/demo-showcase/technical-operations',
      }}
    >
      <div className="space-y-6">
        {/* Fleet Selection */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Fleet Registry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {vessels.map((vessel) => (
              <div
                key={vessel.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedVessel === vessel.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
                onClick={() => setSelectedVessel(vessel.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm truncate">
                      {vessel.name}
                    </div>
                    <div className="text-xs text-gray-500">{vessel.imo}</div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(
                      vessel.status
                    )}`}
                  >
                    {vessel.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white font-medium">
                      {vesselTypeLabels[vessel.type]}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">DWT:</span>
                    <span className="text-white font-medium">
                      {vessel.dwt.toLocaleString()} MT
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Built:</span>
                    <span className="text-white font-medium">{vessel.yearBuilt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vessel Header */}
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">
                {selectedVesselData.name}
              </h3>
              <div className="flex items-center gap-4 text-gray-400">
                <span>{selectedVesselData.imo}</span>
                <span>•</span>
                <span>{selectedVesselData.flag}</span>
                <span>•</span>
                <span>{vesselTypeLabels[selectedVesselData.type]}</span>
                <span>•</span>
                <span>Built {selectedVesselData.yearBuilt}</span>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-lg text-sm font-bold border-2 ${getStatusColor(
                selectedVesselData.status
              )}`}
            >
              {selectedVesselData.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Deadweight</div>
              <div className="text-2xl font-bold text-white">
                {selectedVesselData.dwt.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">MT</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Gross Tonnage</div>
              <div className="text-2xl font-bold text-white">
                {selectedVesselData.grt.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">GT</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Current Position</div>
              <div className="text-xl font-bold text-blue-400">
                {selectedVesselData.currentPosition}
              </div>
              <div className="text-xs text-gray-500">Last updated 2h ago</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Next Port</div>
              <div className="text-xl font-bold text-green-400">
                {selectedVesselData.nextPort}
              </div>
              <div className="text-xs text-gray-500">ETA: {selectedVesselData.eta}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-2 mb-4 border-b border-gray-700">
            {[
              { key: 'specs', label: 'Specifications', icon: '📋' },
              { key: 'certificates', label: 'Certificates', icon: '📜' },
              { key: 'inspections', label: 'Inspections', icon: '✓' },
              { key: 'history', label: 'History', icon: '📊' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 font-medium transition-all ${
                  activeTab === tab.key
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Specifications Tab */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              {specifications.map((spec, idx) => (
                <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                  <h4 className="text-white font-semibold mb-4 text-lg">
                    {spec.category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {spec.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex justify-between">
                        <span className="text-gray-400">{item.label}:</span>
                        <span className="text-white font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === 'certificates' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-white font-semibold mb-1">{cert.name}</div>
                        <div className="text-xs text-gray-500">{cert.type}</div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${getCertificateStatusColor(
                          cert.status
                        )}`}
                      >
                        {cert.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Issue Date:</span>
                        <span className="text-white">{cert.issueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Expiry Date:</span>
                        <span className="text-white font-semibold">{cert.expiryDate}</span>
                      </div>
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
                        {cert.issuingAuthority}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inspections Tab */}
          {activeTab === 'inspections' && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Inspector
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Location
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400">
                      Deficiencies
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {inspections.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-white font-mono">
                        {inspection.date}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{inspection.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {inspection.inspector}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {inspection.location}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-sm font-bold ${
                            inspection.deficiencies === 0
                              ? 'text-green-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          {inspection.deficiencies}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getInspectionResultColor(
                            inspection.result
                          )}`}
                        >
                          {inspection.result.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-xl font-semibold text-white mb-2">
                Voyage History & Analytics
              </div>
              <div className="text-gray-400 mb-4">
                Complete voyage history, performance trends, and operational analytics
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                View Full History
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📈</span> Vessel Performance Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Certificates Valid</div>
              <div className="text-2xl font-bold text-green-400">8/8</div>
              <div className="text-xs text-gray-500">100% compliant</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">PSC Inspections</div>
              <div className="text-2xl font-bold text-blue-400">2</div>
              <div className="text-xs text-gray-500">0 deficiencies</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Operational Days</div>
              <div className="text-2xl font-bold text-purple-400">352</div>
              <div className="text-xs text-gray-500">last 12 months</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Vetting Score</div>
              <div className="text-2xl font-bold text-yellow-400">98%</div>
              <div className="text-xs text-gray-500">excellent</div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
};

export default VesselOverviewShowcase;
