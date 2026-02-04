import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary } from '../components/Modal';

const PORT_RESTRICTIONS = gql`
  query PortRestrictions($portId: String!) {
    portRestrictions(portId: $portId) {
      id portId maxDraft maxLOA maxBeam maxDWT maxAirDraft tidalRange channelDepth
      cargoHandling maxCargoRate terminalType restrictions nightNavigation pilotMandatory
    }
  }
`;

const CHECK_FIT = gql`
  query CheckVesselFit($portId: String!, $vesselDraft: Float!, $vesselLOA: Float!, $vesselBeam: Float!, $vesselDWT: Float!) {
    checkVesselFit(portId: $portId, vesselDraft: $vesselDraft, vesselLOA: $vesselLOA, vesselBeam: $vesselBeam, vesselDWT: $vesselDWT) {
      fits issues maxDraft maxLOA maxBeam
    }
  }
`;

const SET_RESTRICTION = gql`
  mutation SetRestriction($portId: String!, $maxDraft: Float, $maxLOA: Float, $maxBeam: Float, $maxDWT: Float, $cargoHandling: String, $terminalType: String) {
    setPortRestriction(portId: $portId, maxDraft: $maxDraft, maxLOA: $maxLOA, maxBeam: $maxBeam, maxDWT: $maxDWT, cargoHandling: $cargoHandling, terminalType: $terminalType) { id }
  }
`;

export function PortRestrictions() {
  const [portId, setPortId] = useState('');
  const [searchPort, setSearchPort] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [fitForm, setFitForm] = useState({ draft: '', loa: '', beam: '', dwt: '' });
  const [checkFitPort, setCheckFitPort] = useState('');
  const [editForm, setEditForm] = useState({
    maxDraft: '', maxLOA: '', maxBeam: '', maxDWT: '', cargoHandling: '', terminalType: '',
  });

  const { data, loading, refetch } = useQuery(PORT_RESTRICTIONS, {
    variables: { portId: searchPort },
    skip: !searchPort,
  });

  const { data: fitData, loading: fitLoading, refetch: refetchFit } = useQuery(CHECK_FIT, {
    variables: {
      portId: checkFitPort,
      vesselDraft: parseFloat(fitForm.draft) || 0,
      vesselLOA: parseFloat(fitForm.loa) || 0,
      vesselBeam: parseFloat(fitForm.beam) || 0,
      vesselDWT: parseFloat(fitForm.dwt) || 0,
    },
    skip: !checkFitPort,
  });

  const [setRestriction] = useMutation(SET_RESTRICTION);

  const restrictions = data?.portRestrictions;
  const fitResult = fitData?.checkVesselFit;

  const handleSearch = () => {
    if (portId.trim()) setSearchPort(portId.trim());
  };

  const handleCheckFit = () => {
    if (!searchPort || !fitForm.draft || !fitForm.loa || !fitForm.beam || !fitForm.dwt) return;
    setCheckFitPort(searchPort);
    setTimeout(() => refetchFit(), 0);
  };

  const handleEditOpen = () => {
    if (restrictions) {
      setEditForm({
        maxDraft: restrictions.maxDraft?.toString() ?? '',
        maxLOA: restrictions.maxLOA?.toString() ?? '',
        maxBeam: restrictions.maxBeam?.toString() ?? '',
        maxDWT: restrictions.maxDWT?.toString() ?? '',
        cargoHandling: restrictions.cargoHandling ?? '',
        terminalType: restrictions.terminalType ?? '',
      });
    }
    setShowEdit(true);
  };

  const handleSave = async () => {
    await setRestriction({
      variables: {
        portId: searchPort,
        maxDraft: editForm.maxDraft ? parseFloat(editForm.maxDraft) : undefined,
        maxLOA: editForm.maxLOA ? parseFloat(editForm.maxLOA) : undefined,
        maxBeam: editForm.maxBeam ? parseFloat(editForm.maxBeam) : undefined,
        maxDWT: editForm.maxDWT ? parseFloat(editForm.maxDWT) : undefined,
        cargoHandling: editForm.cargoHandling || undefined,
        terminalType: editForm.terminalType || undefined,
      },
    });
    setShowEdit(false);
    refetch();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Port Restrictions</h1>
        <p className="text-maritime-400 text-sm mt-1">Port restriction lookup and vessel fit check</p>
      </div>

      {/* Port ID Input */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 max-w-sm">
          <label className="text-maritime-400 text-xs block mb-1">Port ID</label>
          <input
            value={portId}
            onChange={(e) => setPortId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter port ID (e.g. SGSIN, NLRTM)"
            className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5"
          />
        </div>
        <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm">
          Search
        </button>
      </div>

      {loading && <p className="text-maritime-500 text-sm">Loading restrictions...</p>}

      {searchPort && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Restrictions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-lg">Restrictions</h2>
              <button onClick={handleEditOpen} className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm px-3 py-1.5 rounded">
                Edit
              </button>
            </div>

            {restrictions ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Max Draft', value: restrictions.maxDraft ? `${restrictions.maxDraft} m` : '-', color: 'text-blue-400' },
                  { label: 'Max LOA', value: restrictions.maxLOA ? `${restrictions.maxLOA} m` : '-', color: 'text-cyan-400' },
                  { label: 'Max Beam', value: restrictions.maxBeam ? `${restrictions.maxBeam} m` : '-', color: 'text-teal-400' },
                  { label: 'Max DWT', value: restrictions.maxDWT ? restrictions.maxDWT.toLocaleString() + ' MT' : '-', color: 'text-orange-400' },
                  { label: 'Channel Depth', value: restrictions.channelDepth ? `${restrictions.channelDepth} m` : '-', color: 'text-indigo-400' },
                  { label: 'Tidal Range', value: restrictions.tidalRange ? `${restrictions.tidalRange} m` : '-', color: 'text-purple-400' },
                  { label: 'Cargo Handling', value: restrictions.cargoHandling ?? '-', color: 'text-maritime-300' },
                  { label: 'Terminal Type', value: restrictions.terminalType ?? '-', color: 'text-maritime-300' },
                ].map((item) => (
                  <div key={item.label} className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
                    <p className="text-maritime-500 text-xs">{item.label}</p>
                    <p className={`text-sm font-semibold mt-1 ${item.color}`}>{item.value}</p>
                  </div>
                ))}
                <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
                  <p className="text-maritime-500 text-xs">Night Navigation</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                    restrictions.nightNavigation
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {restrictions.nightNavigation ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
                  <p className="text-maritime-500 text-xs">Pilot Mandatory</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                    restrictions.pilotMandatory
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {restrictions.pilotMandatory ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-maritime-800 rounded-lg p-6 border border-maritime-700 text-center">
                <p className="text-maritime-500 text-sm">No restrictions found for port {searchPort}</p>
              </div>
            )}
          </div>

          {/* Vessel Fit Check Section */}
          <div className="space-y-4">
            <h2 className="text-white font-semibold text-lg">Vessel Fit Check</h2>
            <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-maritime-400 text-xs">Vessel Draft (m)</label>
                  <input
                    value={fitForm.draft}
                    onChange={(e) => setFitForm({ ...fitForm, draft: e.target.value })}
                    type="number"
                    step="0.1"
                    placeholder="e.g. 14.5"
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Vessel LOA (m)</label>
                  <input
                    value={fitForm.loa}
                    onChange={(e) => setFitForm({ ...fitForm, loa: e.target.value })}
                    type="number"
                    step="0.1"
                    placeholder="e.g. 229"
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Vessel Beam (m)</label>
                  <input
                    value={fitForm.beam}
                    onChange={(e) => setFitForm({ ...fitForm, beam: e.target.value })}
                    type="number"
                    step="0.1"
                    placeholder="e.g. 32.2"
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Vessel DWT (MT)</label>
                  <input
                    value={fitForm.dwt}
                    onChange={(e) => setFitForm({ ...fitForm, dwt: e.target.value })}
                    type="number"
                    step="1"
                    placeholder="e.g. 81000"
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1"
                  />
                </div>
              </div>
              <button onClick={handleCheckFit} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm w-full">
                Check Vessel Fit
              </button>
            </div>

            {fitLoading && <p className="text-maritime-500 text-sm">Checking...</p>}

            {fitResult && (
              <div className={`rounded-lg p-4 border ${
                fitResult.fits
                  ? 'bg-green-900/20 border-green-700'
                  : 'bg-red-900/20 border-red-700'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-lg font-bold ${fitResult.fits ? 'text-green-400' : 'text-red-400'}`}>
                    {fitResult.fits ? 'VESSEL FITS' : 'VESSEL DOES NOT FIT'}
                  </span>
                </div>
                {!fitResult.fits && fitResult.issues && (
                  <div className="space-y-1 mt-3">
                    <p className="text-maritime-400 text-xs font-medium">Issues:</p>
                    <ul className="space-y-1">
                      {(fitResult.issues as string[]).map((issue: string, i: number) => (
                        <li key={i} className="text-red-400 text-xs flex items-center gap-1.5">
                          <span className="text-red-500">&#x2022;</span> {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {fitResult.fits && (
                  <p className="text-green-400/70 text-xs mt-1">
                    All vessel dimensions are within port limits.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Restriction Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Port Restrictions">
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Max Draft (m)">
              <input
                value={editForm.maxDraft}
                onChange={(e) => setEditForm({ ...editForm, maxDraft: e.target.value })}
                type="number"
                step="0.1"
                className={inputClass}
              />
            </FormField>
            <FormField label="Max LOA (m)">
              <input
                value={editForm.maxLOA}
                onChange={(e) => setEditForm({ ...editForm, maxLOA: e.target.value })}
                type="number"
                step="0.1"
                className={inputClass}
              />
            </FormField>
            <FormField label="Max Beam (m)">
              <input
                value={editForm.maxBeam}
                onChange={(e) => setEditForm({ ...editForm, maxBeam: e.target.value })}
                type="number"
                step="0.1"
                className={inputClass}
              />
            </FormField>
            <FormField label="Max DWT (MT)">
              <input
                value={editForm.maxDWT}
                onChange={(e) => setEditForm({ ...editForm, maxDWT: e.target.value })}
                type="number"
                step="1"
                className={inputClass}
              />
            </FormField>
          </div>
          <FormField label="Cargo Handling">
            <select
              value={editForm.cargoHandling}
              onChange={(e) => setEditForm({ ...editForm, cargoHandling: e.target.value })}
              className={selectClass}
            >
              <option value="">Select</option>
              <option value="geared">Geared</option>
              <option value="gearless">Gearless</option>
              <option value="both">Both</option>
            </select>
          </FormField>
          <FormField label="Terminal Type">
            <select
              value={editForm.terminalType}
              onChange={(e) => setEditForm({ ...editForm, terminalType: e.target.value })}
              className={selectClass}
            >
              <option value="">Select</option>
              <option value="dry_bulk">Dry Bulk</option>
              <option value="liquid_bulk">Liquid Bulk</option>
              <option value="container">Container</option>
              <option value="general_cargo">General Cargo</option>
              <option value="multi_purpose">Multi-Purpose</option>
            </select>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setShowEdit(false)} className="text-maritime-400 text-sm hover:text-white px-4 py-2">Cancel</button>
          <button onClick={handleSave} className={btnPrimary}>Save Restrictions</button>
        </div>
      </Modal>
    </div>
  );
}
