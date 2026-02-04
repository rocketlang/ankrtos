import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const SALE_LISTINGS_QUERY = gql`
  query SaleListings($status: String) {
    saleListings(status: $status) {
      id vesselId askingPrice currency condition classStatus
      specialSurveyDue highlights brokerNotes status publishedAt
      vessel { id name imo type dwt yearBuilt flag }
      sellerOrg { id name }
      interests { id status }
      offers { id amount status }
      createdAt
    }
  }
`

const VESSELS_QUERY = gql`
  query VesselsForListing {
    vessels { id name imo type dwt yearBuilt flag }
  }
`

const CREATE_LISTING = gql`
  mutation CreateSaleListing(
    $vesselId: String!, $askingPrice: Float!, $currency: String!,
    $condition: String!, $highlights: String, $brokerNotes: String
  ) {
    createSaleListing(
      vesselId: $vesselId, askingPrice: $askingPrice, currency: $currency,
      condition: $condition, highlights: $highlights, brokerNotes: $brokerNotes
    ) { id }
  }
`

const PUBLISH_LISTING = gql`
  mutation PublishListing($id: String!) {
    publishSaleListing(id: $id) { id status }
  }
`

const WITHDRAW_LISTING = gql`
  mutation WithdrawListing($id: String!) {
    withdrawSaleListing(id: $id) { id status }
  }
`

const statusTabs = ['all', 'draft', 'active', 'under_offer', 'sold', 'withdrawn'] as const

const statusColors: Record<string, string> = {
  draft: 'bg-gray-800/60 text-gray-400',
  active: 'bg-green-900/50 text-green-400',
  under_offer: 'bg-amber-900/50 text-amber-400',
  sold: 'bg-blue-900/50 text-blue-400',
  withdrawn: 'bg-red-900/50 text-red-400',
}

const conditionOptions = ['excellent', 'good', 'fair', 'needs_repair']

const emptyForm = {
  vesselId: '',
  askingPrice: '',
  currency: 'USD',
  condition: 'good',
  highlights: '',
  brokerNotes: '',
}

export function SaleListings() {
  const [activeTab, setActiveTab] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const { data, loading, error, refetch } = useQuery(SALE_LISTINGS_QUERY, {
    variables: activeTab !== 'all' ? { status: activeTab } : {},
  })
  const { data: vesselsData } = useQuery(VESSELS_QUERY)
  const [createListing, { loading: creating }] = useMutation(CREATE_LISTING)
  const [publishListing] = useMutation(PUBLISH_LISTING)
  const [withdrawListing] = useMutation(WITHDRAW_LISTING)

  const listings = data?.saleListings ?? []

  const counts = {
    total: listings.length,
    active: listings.filter((l: Record<string, unknown>) => l.status === 'active').length,
    under_offer: listings.filter((l: Record<string, unknown>) => l.status === 'under_offer').length,
    sold: listings.filter((l: Record<string, unknown>) => l.status === 'sold').length,
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createListing({
      variables: {
        vesselId: form.vesselId,
        askingPrice: Number(form.askingPrice),
        currency: form.currency,
        condition: form.condition,
        highlights: form.highlights || null,
        brokerNotes: form.brokerNotes || null,
      },
    })
    setForm(emptyForm)
    setShowCreate(false)
    refetch()
  }

  const handlePublish = async (id: string) => {
    await publishListing({ variables: { id } })
    refetch()
  }

  const handleWithdraw = async (id: string) => {
    if (!confirm('Withdraw this listing?')) return
    await withdrawListing({ variables: { id } })
    refetch()
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)

  return (
    <div className="p-8 bg-maritime-900 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sale &amp; Purchase Listings</h1>
          <p className="text-maritime-400 text-sm mt-1">Vessels for sale - S&amp;P broker marketplace</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New Listing</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Listings', value: counts.total, color: 'text-white' },
          { label: 'Active', value: counts.active, color: 'text-green-400' },
          { label: 'Under Offer', value: counts.under_offer, color: 'text-amber-400' },
          { label: 'Sold', value: counts.sold, color: 'text-blue-400' },
        ].map((c) => (
          <div key={c.label} className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <p className="text-maritime-400 text-xs">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-6 bg-maritime-800 rounded-lg p-1 w-fit">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'text-maritime-400 hover:text-white hover:bg-maritime-700'
            }`}
          >
            {tab === 'all' ? 'All' : tab.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading && <p className="text-maritime-400">Loading listings...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Listing Cards Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing: Record<string, unknown>) => {
            const vessel = listing.vessel as Record<string, unknown> | null
            const seller = listing.sellerOrg as Record<string, unknown> | null
            const interests = listing.interests as Array<Record<string, unknown>> | null
            const offers = listing.offers as Array<Record<string, unknown>> | null
            const status = listing.status as string

            return (
              <div key={listing.id as string} className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden hover:border-maritime-600 transition-colors">
                {/* Vessel Photo Placeholder */}
                <div className="h-32 bg-maritime-700/50 flex items-center justify-center">
                  <span className="text-4xl text-maritime-500">&#x1F6A2;</span>
                </div>

                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-semibold text-sm">{vessel?.name as string ?? 'Unknown'}</h3>
                      <p className="text-maritime-400 text-xs font-mono">IMO {vessel?.imo as string ?? '-'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[status] ?? 'bg-gray-800/60 text-gray-400'}`}>
                      {status?.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Vessel Specs */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3 text-xs">
                    <div><span className="text-maritime-500">Type:</span> <span className="text-maritime-300">{vessel?.type as string ?? '-'}</span></div>
                    <div><span className="text-maritime-500">DWT:</span> <span className="text-maritime-300">{(vessel?.dwt as number)?.toLocaleString() ?? '-'}</span></div>
                    <div><span className="text-maritime-500">Year:</span> <span className="text-maritime-300">{vessel?.yearBuilt as number ?? '-'}</span></div>
                    <div><span className="text-maritime-500">Flag:</span> <span className="text-maritime-300">{vessel?.flag as string ?? '-'}</span></div>
                  </div>

                  {/* Price & Condition */}
                  <div className="flex items-center justify-between mb-3 py-2 border-t border-b border-maritime-700/50">
                    <div>
                      <p className="text-maritime-500 text-xs">Asking Price</p>
                      <p className="text-white font-bold text-lg">
                        {formatPrice(listing.askingPrice as number, listing.currency as string ?? 'USD')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-maritime-500 text-xs">Condition</p>
                      <p className="text-maritime-300 text-sm capitalize">{(listing.condition as string)?.replace('_', ' ') ?? '-'}</p>
                    </div>
                  </div>

                  {/* Seller & Interest */}
                  <div className="flex items-center justify-between text-xs mb-4">
                    <span className="text-maritime-400">Seller: {seller?.name as string ?? '-'}</span>
                    <div className="flex gap-3">
                      <span className="text-maritime-400">{interests?.length ?? 0} interested</span>
                      <span className="text-maritime-400">{offers?.length ?? 0} offers</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {status === 'draft' && (
                      <button onClick={() => handlePublish(listing.id as string)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs flex-1">
                        Publish
                      </button>
                    )}
                    {status === 'active' && (
                      <button onClick={() => handleWithdraw(listing.id as string)} className="bg-red-600/80 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs flex-1">
                        Withdraw
                      </button>
                    )}
                    <button className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 px-3 py-1.5 rounded text-xs flex-1">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {listings.length === 0 && !loading && (
            <div className="col-span-3 text-center py-16">
              <p className="text-maritime-500 text-sm">No listings found</p>
            </div>
          )}
        </div>
      )}

      {/* Create Listing Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Sale Listing">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Vessel *">
              <select value={form.vesselId} onChange={set('vesselId')} className={selectClass} required>
                <option value="">Select vessel...</option>
                {(vesselsData?.vessels ?? []).map((v: Record<string, unknown>) => (
                  <option key={v.id as string} value={v.id as string}>
                    {v.name as string} (IMO {v.imo as string})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Condition *">
              <select value={form.condition} onChange={set('condition')} className={selectClass} required>
                {conditionOptions.map((c) => (
                  <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Asking Price *">
              <input type="number" value={form.askingPrice} onChange={set('askingPrice')} className={inputClass} required placeholder="15000000" />
            </FormField>
            <FormField label="Currency">
              <select value={form.currency} onChange={set('currency')} className={selectClass}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </FormField>
          </div>
          <FormField label="Highlights">
            <textarea value={form.highlights} onChange={set('highlights')} className={inputClass + ' h-20 resize-none'} placeholder="Key selling points..." />
          </FormField>
          <FormField label="Broker Notes">
            <textarea value={form.brokerNotes} onChange={set('brokerNotes')} className={inputClass + ' h-20 resize-none'} placeholder="Internal notes..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
