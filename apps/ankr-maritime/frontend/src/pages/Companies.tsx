import { useQuery, useMutation, useLazyQuery, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const COMPANIES_QUERY = gql`
  query Companies {
    companies { id name type country address contactEmail contactPhone }
  }
`;

const CREATE_COMPANY = gql`
  mutation CreateCompany(
    $name: String!, $type: String!, $country: String, $address: String,
    $contactEmail: String, $contactPhone: String
  ) {
    createCompany(
      name: $name, type: $type, country: $country, address: $address,
      contactEmail: $contactEmail, contactPhone: $contactPhone
    ) { id }
  }
`;

const VENDOR_AVG_QUERY = gql`
  query VendorAvg($companyId: String!) {
    vendorAvgRating(companyId: $companyId) {
      companyId avgRating totalRatings
      categories { category avg count }
    }
  }
`;

const VENDOR_RATINGS_QUERY = gql`
  query VendorRatings($companyId: String!) {
    vendorRatings(companyId: $companyId) { id rating category comment createdAt }
  }
`;

const ADD_RATING = gql`
  mutation AddRating($companyId: String!, $rating: Int!, $category: String!, $comment: String) {
    addVendorRating(companyId: $companyId, rating: $rating, category: $category, comment: $comment) { id }
  }
`;

const typeColors: Record<string, string> = {
  charterer: 'bg-purple-900/50 text-purple-400',
  shipowner: 'bg-indigo-900/50 text-indigo-400',
  broker: 'bg-blue-900/50 text-blue-400',
  agent: 'bg-green-900/50 text-green-400',
  cha: 'bg-yellow-900/50 text-yellow-400',
  bunker_supplier: 'bg-orange-900/50 text-orange-400',
  stevedore: 'bg-teal-900/50 text-teal-400',
};

const ratingCategories = ['reliability', 'cost', 'communication', 'speed'];
const companyTypes = ['charterer', 'shipowner', 'broker', 'agent', 'cha', 'bunker_supplier', 'stevedore'];

const emptyForm = { name: '', type: 'charterer', country: '', address: '', contactEmail: '', contactPhone: '' };
const emptyRating = { rating: '5', category: 'reliability', comment: '' };

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  const sz = size === 'lg' ? 'text-lg' : 'text-sm';
  return (
    <span className={`${sz} inline-flex gap-0.5`}>
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < full ? 'text-yellow-400' : (i === full && half) ? 'text-yellow-600' : 'text-maritime-700'}>
          &#9733;
        </span>
      ))}
    </span>
  );
}

export function Companies() {
  const { data, loading, error, refetch } = useQuery(COMPANIES_QUERY);
  const [createCompany, { loading: creating }] = useMutation(CREATE_COMPANY);
  const [addRating, { loading: addingRating }] = useMutation(ADD_RATING);
  const [fetchAvg, { data: avgData }] = useLazyQuery(VENDOR_AVG_QUERY, { fetchPolicy: 'network-only' });
  const [fetchRatings, { data: ratingsData }] = useLazyQuery(VENDOR_RATINGS_QUERY, { fetchPolicy: 'network-only' });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddRating, setShowAddRating] = useState(false);
  const [ratingForm, setRatingForm] = useState(emptyRating);
  const [ratingCompanyId, setRatingCompanyId] = useState('');

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCompany({
      variables: {
        name: form.name, type: form.type,
        country: form.country || null, address: form.address || null,
        contactEmail: form.contactEmail || null, contactPhone: form.contactPhone || null,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchAvg({ variables: { companyId: id } });
      fetchRatings({ variables: { companyId: id } });
    }
  };

  const openAddRating = (companyId: string) => {
    setRatingCompanyId(companyId);
    setRatingForm(emptyRating);
    setShowAddRating(true);
  };

  const handleAddRating = async (e: React.FormEvent) => {
    e.preventDefault();
    await addRating({
      variables: {
        companyId: ratingCompanyId,
        rating: Number(ratingForm.rating),
        category: ratingForm.category,
        comment: ratingForm.comment || null,
      },
    });
    setShowAddRating(false);
    fetchAvg({ variables: { companyId: ratingCompanyId } });
    fetchRatings({ variables: { companyId: ratingCompanyId } });
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const setR = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setRatingForm((f) => ({ ...f, [field]: e.target.value }));

  const avg = avgData?.vendorAvgRating;
  const ratings = ratingsData?.vendorRatings ?? [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Directory</h1>
          <p className="text-maritime-400 text-sm mt-1">Charterers, brokers, agents &amp; suppliers</p>
        </div>
        <div className="flex gap-3">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
            <option value="all">All Types</option>
            {types.map((t) => (
              <option key={t as string} value={t as string}>{(t as string).replace(/_/g, ' ')}</option>
            ))}
          </select>
          <input type="text" placeholder="Search companies..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64" />
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ Add Company</button>
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading companies...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c: Record<string, unknown>) => (
            <div key={c.id as string}
              className={`bg-maritime-800 border rounded-lg transition-colors ${
                expandedId === c.id ? 'border-blue-600 col-span-1 md:col-span-2 lg:col-span-3' : 'border-maritime-700 hover:border-maritime-500'
              }`}>
              {/* Card header */}
              <div className="p-4 cursor-pointer" onClick={() => toggleExpand(c.id as string)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium">{c.name as string}</h3>
                    <span className="text-maritime-600 text-xs">{expandedId === c.id ? '\u25B2' : '\u25BC'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[(c.type as string)] ?? 'bg-maritime-700 text-maritime-300'}`}>
                    {(c.type as string).replace(/_/g, ' ')}
                  </span>
                </div>
                {c.country && <p className="text-maritime-400 text-sm">{c.country as string}</p>}
                {c.contactEmail && <p className="text-maritime-500 text-xs mt-2">{c.contactEmail as string}</p>}
                {c.contactPhone && <p className="text-maritime-500 text-xs">{c.contactPhone as string}</p>}
              </div>

              {/* Expanded: Vendor Ratings */}
              {expandedId === c.id && (
                <div className="border-t border-maritime-700 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white text-sm font-medium">Vendor Ratings</h4>
                    <button onClick={() => openAddRating(c.id as string)} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">
                      + Rate Vendor
                    </button>
                  </div>

                  {/* Average summary */}
                  {avg && avg.companyId === c.id ? (
                    <div className="bg-maritime-900/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Stars rating={avg.avgRating} size="lg" />
                        <span className="text-white text-lg font-bold">{avg.avgRating}</span>
                        <span className="text-maritime-500 text-sm">({avg.totalRatings} ratings)</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {avg.categories.map((cat: { category: string; avg: number; count: number }) => (
                          <div key={cat.category} className="bg-maritime-800 rounded p-2">
                            <p className="text-maritime-400 text-xs capitalize mb-1">{cat.category}</p>
                            <div className="flex items-center gap-2">
                              <Stars rating={cat.avg} />
                              <span className="text-maritime-300 text-xs">{cat.avg.toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-maritime-500 text-xs mb-4">No ratings yet. Be the first to rate this vendor.</p>
                  )}

                  {/* Recent ratings list */}
                  {ratings.length > 0 && ratings[0]?.companyId !== undefined && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <h5 className="text-maritime-400 text-xs font-medium mb-2">Recent Reviews</h5>
                      {(ratings as Array<Record<string, unknown>>).map((r) => (
                        <div key={r.id as string} className="bg-maritime-900/30 rounded p-3 flex items-start gap-3">
                          <Stars rating={r.rating as number} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-maritime-300 text-xs capitalize font-medium">{r.category as string}</span>
                              <span className="text-maritime-600 text-[10px]">
                                {new Date(r.createdAt as string).toLocaleDateString()}
                              </span>
                            </div>
                            {r.comment && <p className="text-maritime-400 text-xs mt-1">{r.comment as string}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {companies.length === 0 && (
            <p className="text-maritime-500 col-span-3 text-center py-8">No companies found</p>
          )}
        </div>
      )}

      {/* Create Company Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Company">
        <form onSubmit={handleCreate}>
          <FormField label="Company Name *">
            <input value={form.name} onChange={set('name')} className={inputClass} required placeholder="Pacific Shipping Co." />
          </FormField>
          <FormField label="Type *">
            <select value={form.type} onChange={set('type')} className={selectClass} required>
              {companyTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Country">
              <input value={form.country} onChange={set('country')} className={inputClass} placeholder="India" />
            </FormField>
            <FormField label="Contact Email">
              <input type="email" value={form.contactEmail} onChange={set('contactEmail')} className={inputClass} placeholder="info@company.com" />
            </FormField>
          </div>
          <FormField label="Address">
            <input value={form.address} onChange={set('address')} className={inputClass} placeholder="123 Port Road, Mumbai" />
          </FormField>
          <FormField label="Phone">
            <input value={form.contactPhone} onChange={set('contactPhone')} className={inputClass} placeholder="+91 98765 43210" />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Add Company'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Rating Modal */}
      <Modal open={showAddRating} onClose={() => setShowAddRating(false)} title="Rate Vendor">
        <form onSubmit={handleAddRating}>
          <FormField label="Category *">
            <select value={ratingForm.category} onChange={setR('category')} className={selectClass} required>
              {ratingCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Rating *">
            <div className="flex gap-2 items-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button"
                  onClick={() => setRatingForm((f) => ({ ...f, rating: String(n) }))}
                  className={`text-2xl transition-colors ${
                    n <= Number(ratingForm.rating) ? 'text-yellow-400' : 'text-maritime-700 hover:text-maritime-500'
                  }`}>
                  &#9733;
                </button>
              ))}
              <span className="text-white text-sm ml-2">{ratingForm.rating}/5</span>
            </div>
          </FormField>
          <FormField label="Comment">
            <textarea value={ratingForm.comment} onChange={setR('comment')}
              className={`${inputClass} h-20 resize-none`} placeholder="Reliable agent, fast turnaround..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAddRating(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={addingRating} className={btnPrimary}>
              {addingRating ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
