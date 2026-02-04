import { useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';

const GET_VESSEL_OWNER = gql`
  query GetVesselOwner($imoNumber: String!) {
    vesselOwnerByIMO(imoNumber: $imoNumber) {
      name
      imoNumber
      callSign
      flag
      mmsi
      type
      buildDate
      grossTonnage
      registeredOwner
      operator
      technicalManager
      docCompany
      scrapedAt
    }
  }
`;

interface VesselOwnerFetcherProps {
  imoNumber: string;
  vesselName?: string;
}

export function VesselOwnerFetcher({ imoNumber, vesselName }: VesselOwnerFetcherProps) {
  const [fetchOwner, { data, loading, error }] = useLazyQuery(GET_VESSEL_OWNER);
  const [fetched, setFetched] = useState(false);

  const handleFetchOwner = async () => {
    setFetched(true);
    await fetchOwner({ variables: { imoNumber } });
  };

  return (
    <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-maritime-100">
          Vessel Ownership
        </h3>
        {!fetched && (
          <button
            onClick={handleFetchOwner}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Fetching...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Fetch Owner from GISIS
              </span>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">
            ❌ Failed to fetch owner: {error.message}
          </p>
        </div>
      )}

      {data?.vesselOwnerByIMO && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-maritime-400">Vessel Name</p>
              <p className="text-maritime-100 font-medium">
                {data.vesselOwnerByIMO.name || vesselName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-maritime-400">IMO Number</p>
              <p className="text-maritime-100 font-medium">
                {data.vesselOwnerByIMO.imoNumber || imoNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-maritime-400">Flag</p>
              <p className="text-maritime-100">
                {data.vesselOwnerByIMO.flag || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-maritime-400">Type</p>
              <p className="text-maritime-100">
                {data.vesselOwnerByIMO.type || 'N/A'}
              </p>
            </div>
          </div>

          <div className="border-t border-maritime-700 pt-3">
            <h4 className="text-sm font-semibold text-maritime-300 mb-2">
              🏢 Ownership Information
            </h4>

            {data.vesselOwnerByIMO.registeredOwner ? (
              <div className="space-y-2">
                <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                  <p className="text-xs text-green-400 mb-1">Registered Owner</p>
                  <p className="text-green-100 font-semibold text-lg">
                    {data.vesselOwnerByIMO.registeredOwner}
                  </p>
                </div>

                {data.vesselOwnerByIMO.operator && (
                  <div>
                    <p className="text-xs text-maritime-400">Operator</p>
                    <p className="text-maritime-200">{data.vesselOwnerByIMO.operator}</p>
                  </div>
                )}

                {data.vesselOwnerByIMO.technicalManager && (
                  <div>
                    <p className="text-xs text-maritime-400">Technical Manager</p>
                    <p className="text-maritime-200">{data.vesselOwnerByIMO.technicalManager}</p>
                  </div>
                )}

                {data.vesselOwnerByIMO.docCompany && (
                  <div>
                    <p className="text-xs text-maritime-400">DOC Company</p>
                    <p className="text-maritime-200">{data.vesselOwnerByIMO.docCompany}</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    className="flex-1 px-4 py-2 bg-maritime-700 hover:bg-maritime-600
                             text-maritime-100 rounded-lg transition-colors text-sm"
                  >
                    📧 Contact Owner
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-maritime-700 hover:bg-maritime-600
                             text-maritime-100 rounded-lg transition-colors text-sm"
                  >
                    🔍 View Company Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Ownership data not available for this vessel
                </p>
              </div>
            )}

            {data.vesselOwnerByIMO.scrapedAt && (
              <p className="text-xs text-maritime-500 mt-2">
                Data fetched from IMO GISIS on{' '}
                {new Date(data.vesselOwnerByIMO.scrapedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {!fetched && !loading && (
        <div className="text-center py-8 text-maritime-400">
          <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm">
            Click "Fetch Owner from GISIS" to retrieve vessel ownership data
          </p>
          <p className="text-xs mt-1 text-maritime-500">
            Powered by IMO GISIS Public Database
          </p>
        </div>
      )}
    </div>
  );
}
