import { useQuery, gql } from '@apollo/client';
import { useState } from 'react';

const COMPANIES_QUERY = gql`
  query Companies {
    companies {
      id
      name
      type
      country
      contactEmail
      contactPhone
    }
  }
`;

const typeColors: Record<string, string> = {
  charterer: 'bg-purple-900/50 text-purple-400',
  broker: 'bg-blue-900/50 text-blue-400',
  agent: 'bg-green-900/50 text-green-400',
  cha: 'bg-yellow-900/50 text-yellow-400',
  bunker_supplier: 'bg-orange-900/50 text-orange-400',
  stevedore: 'bg-teal-900/50 text-teal-400',
};

export function Companies() {
  const { data, loading, error } = useQuery(COMPANIES_QUERY);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const companies = data?.companies?.filter(
    (c: { name: string; type: string; country?: string }) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.country?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesType = typeFilter === 'all' || c.type === typeFilter;
      return matchesSearch && matchesType;
    },
  ) ?? [];

  const types = [...new Set((data?.companies ?? []).map((c: { type: string }) => c.type))];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Directory</h1>
          <p className="text-maritime-400 text-sm mt-1">Charterers, brokers, agents &amp; suppliers</p>
        </div>
        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm"
          >
            <option value="all">All Types</option>
            {types.map((t) => (
              <option key={t as string} value={t as string}>{(t as string).replace(/_/g, ' ')}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading companies...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c: Record<string, unknown>) => (
            <div key={c.id as string} className="bg-maritime-800 border border-maritime-700 rounded-lg p-4 hover:border-maritime-500 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-medium">{c.name as string}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[(c.type as string)] ?? 'bg-maritime-700 text-maritime-300'}`}>
                  {(c.type as string).replace(/_/g, ' ')}
                </span>
              </div>
              {c.country && <p className="text-maritime-400 text-sm">{c.country as string}</p>}
              {c.contactEmail && (
                <p className="text-maritime-500 text-xs mt-2">{c.contactEmail as string}</p>
              )}
            </div>
          ))}
          {companies.length === 0 && (
            <p className="text-maritime-500 col-span-3 text-center py-8">No companies found</p>
          )}
        </div>
      )}
    </div>
  );
}
