import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;

const VE_HISTORY = gql`
  query VEHistory($voyageId: String, $charterId: String) {
    voyageEstimateHistory(voyageId: $voyageId, charterId: $charterId) {
      id label vesselName cargoQuantity freightRate seaDistanceNm
      grossRevenue netRevenue totalCosts netResult tce totalDays
      currency createdBy createdAt
    }
  }
`;

const DELETE_VE = gql`
  mutation DeleteVE($id: String!) {
    deleteVoyageEstimateHistory(id: $id)
  }
`;

interface EstimateRow {
  id: string;
  label: string;
  vesselName: string;
  cargoQuantity: number;
  freightRate: number;
  seaDistanceNm: number;
  grossRevenue: number;
  netRevenue: number;
  totalCosts: number;
  netResult: number;
  tce: number;
  totalDays: number;
  currency: string;
  createdBy: string;
  createdAt: string;
}

function fmt(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtNum(n: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(n);
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString() : '-';

export function VoyageEstimateHistoryPage() {
  const [voyageId, setVoyageId] = useState('');
  const [charterId, setCharterId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(VE_HISTORY, {
    variables: {
      voyageId: voyageId || null,
      charterId: charterId || null,
    },
  });

  const [deleteVE, { loading: deleting }] = useMutation(DELETE_VE);

  const rows: EstimateRow[] = data?.voyageEstimateHistory ?? [];

  const handleDelete = async (id: string) => {
    await deleteVE({ variables: { id } });
    setConfirmDelete(null);
    refetch();
  };

  // Summary calculations
  const count = rows.length;
  const tces = rows.map((r) => r.tce);
  const bestTce = count > 0 ? Math.max(...tces) : 0;
  const worstTce = count > 0 ? Math.min(...tces) : 0;
  const avgTce = count > 0 ? tces.reduce((a, b) => a + b, 0) / count : 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Voyage Estimate History
          </h1>
          <p className="text-maritime-400 text-sm mt-1">
            Compare saved voyage estimates and TCE results
          </p>
        </div>
      </div>

      {/* Filter Inputs */}
      <div className="flex items-end gap-4 mb-6">
        <div>
          <label className="block text-xs text-maritime-400 mb-1 font-medium">
            Voyage ID
          </label>
          <input
            value={voyageId}
            onChange={(e) => setVoyageId(e.target.value)}
            placeholder="Filter by voyage ID..."
            className="bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
        <div>
          <label className="block text-xs text-maritime-400 mb-1 font-medium">
            Charter ID
          </label>
          <input
            value={charterId}
            onChange={(e) => setCharterId(e.target.value)}
            placeholder="Filter by charter ID..."
            className="bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
        <button
          onClick={() => refetch()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm"
        >
          Apply Filters
        </button>
        {(voyageId || charterId) && (
          <button
            onClick={() => {
              setVoyageId('');
              setCharterId('');
            }}
            className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 px-3 py-1.5 rounded text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
          <p className="text-maritime-400 text-xs">Total Estimates</p>
          <p className="text-white text-2xl font-bold mt-1">{count}</p>
        </div>
        <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
          <p className="text-maritime-400 text-xs">Best TCE</p>
          <p
            className={`text-2xl font-bold mt-1 font-mono ${bestTce >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {count > 0 ? fmt(bestTce) : '-'}
          </p>
        </div>
        <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
          <p className="text-maritime-400 text-xs">Worst TCE</p>
          <p
            className={`text-2xl font-bold mt-1 font-mono ${worstTce >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {count > 0 ? fmt(worstTce) : '-'}
          </p>
        </div>
        <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
          <p className="text-maritime-400 text-xs">Average TCE</p>
          <p
            className={`text-2xl font-bold mt-1 font-mono ${avgTce >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {count > 0 ? fmt(avgTce) : '-'}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading && <p className="text-maritime-400">Loading estimates...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && rows.length === 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <h3 className="text-white font-medium mt-4">
            No Saved Estimates Found
          </h3>
          <p className="text-maritime-400 text-sm mt-2">
            Save a voyage estimate from the calculator to see it here.
          </p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-maritime-800 text-maritime-400 text-xs">
                  <th className="text-left px-4 py-3 font-medium">Label</th>
                  <th className="text-left px-4 py-3 font-medium">Vessel</th>
                  <th className="text-right px-4 py-3 font-medium">
                    Cargo (MT)
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    Freight Rate
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    Distance (NM)
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    Gross Rev
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    Net Result
                  </th>
                  <th className="text-right px-4 py-3 font-medium">TCE</th>
                  <th className="text-right px-4 py-3 font-medium">Days</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-maritime-700 hover:bg-maritime-700/30"
                  >
                    <td className="px-4 py-3 text-white font-medium">
                      {row.label || '-'}
                    </td>
                    <td className="px-4 py-3 text-maritime-300">
                      {row.vesselName || '-'}
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-right font-mono">
                      {fmtNum(row.cargoQuantity)}
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-right font-mono">
                      {row.freightRate.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-right font-mono">
                      {fmtNum(row.seaDistanceNm)}
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-right font-mono">
                      {fmt(row.grossRevenue, row.currency || 'USD')}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-medium ${row.netResult >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {fmt(row.netResult, row.currency || 'USD')}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-bold ${row.tce >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {fmt(row.tce, row.currency || 'USD')}
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-right font-mono">
                      {row.totalDays.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">
                      {fmtDate(row.createdAt)}
                      {row.createdBy && (
                        <span className="block text-maritime-500">
                          {row.createdBy}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {confirmDelete === row.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDelete(row.id)}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                          >
                            {deleting ? '...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 px-2 py-1 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(row.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
