import { useQuery, useMutation, useLazyQuery, gql } from '@apollo/client'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const AGENTS_QUERY = gql`
  query PortAgents($country: String, $serviceType: String, $minRating: Float) {
    portAgents(country: $country, serviceType: $serviceType, minRating: $minRating) {
      id companyName contactPerson email phone country city
      serviceTypes rating totalJobs avgResponseHrs isVerified licenseNumber
    }
  }
`

const AGENT_SEARCH = gql`
  query PortAgentSearch($query: String!) {
    portAgentSearch(query: $query) {
      id companyName contactPerson email phone country city
      serviceTypes rating totalJobs avgResponseHrs isVerified licenseNumber
    }
  }
`

const CREATE_AGENT = gql`
  mutation CreatePortAgent(
    $companyName: String!, $contactPerson: String!, $email: String!, $phone: String,
    $country: String!, $city: String!, $serviceTypes: [String!]!, $licenseNumber: String
  ) {
    createPortAgent(
      companyName: $companyName, contactPerson: $contactPerson, email: $email, phone: $phone,
      country: $country, city: $city, serviceTypes: $serviceTypes, licenseNumber: $licenseNumber
    ) { id }
  }
`

const VERIFY_AGENT = gql`
  mutation VerifyPortAgent($id: String!) {
    verifyPortAgent(id: $id) { id isVerified }
  }
`

const serviceTypeOptions = [
  { value: 'husbandry', label: 'Husbandry' },
  { value: 'protective', label: 'Protective' },
  { value: 'liner', label: 'Liner' },
  { value: 'customs', label: 'Customs' },
  { value: 'forwarding', label: 'Forwarding' },
]

const serviceTypeBadge: Record<string, string> = {
  husbandry: 'bg-blue-900/50 text-blue-400',
  protective: 'bg-purple-900/50 text-purple-400',
  liner: 'bg-teal-900/50 text-teal-400',
  customs: 'bg-yellow-900/50 text-yellow-400',
  forwarding: 'bg-green-900/50 text-green-400',
}

const emptyForm = {
  companyName: '', contactPerson: '', email: '', phone: '',
  country: '', city: '', serviceTypes: [] as string[], licenseNumber: '',
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.3
  const sz = size === 'lg' ? 'text-lg' : 'text-sm'
  return (
    <span className={`${sz} inline-flex gap-0.5`}>
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < full ? 'text-yellow-400' : (i === full && half) ? 'text-yellow-600' : 'text-maritime-700'}>
          &#9733;
        </span>
      ))}
    </span>
  )
}

export function AgentDirectory() {
  const [filterCountry, setFilterCountry] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterServiceTypes, setFilterServiceTypes] = useState<string[]>([])
  const [filterMinRating, setFilterMinRating] = useState(0)
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const { data, loading, error, refetch } = useQuery(AGENTS_QUERY, {
    variables: {
      country: filterCountry || undefined,
      serviceType: filterServiceTypes.length === 1 ? filterServiceTypes[0] : undefined,
      minRating: filterMinRating > 0 ? filterMinRating : undefined,
    },
  })

  const [searchAgents, { data: searchData, loading: searchLoading }] = useLazyQuery(AGENT_SEARCH, {
    fetchPolicy: 'network-only',
  })

  const [createAgent, { loading: creating }] = useMutation(CREATE_AGENT)
  const [verifyAgent] = useMutation(VERIFY_AGENT)

  const rawAgents = search && searchData?.portAgentSearch
    ? searchData.portAgentSearch
    : data?.portAgents ?? []

  const agents = useMemo(() => {
    let list = [...rawAgents] as Array<Record<string, unknown>>
    if (filterCity) {
      list = list.filter((a) =>
        (a.city as string)?.toLowerCase().includes(filterCity.toLowerCase())
      )
    }
    if (filterServiceTypes.length > 1) {
      list = list.filter((a) => {
        const types = a.serviceTypes as string[]
        return filterServiceTypes.some((ft) => types?.includes(ft))
      })
    }
    if (filterVerifiedOnly) {
      list = list.filter((a) => a.isVerified === true)
    }
    return list
  }, [rawAgents, filterCity, filterServiceTypes, filterVerifiedOnly])

  const stats = useMemo(() => {
    const all = (data?.portAgents ?? []) as Array<Record<string, unknown>>
    const verified = all.filter((a) => a.isVerified === true).length
    const ratings = all.map((a) => a.rating as number).filter((r) => r > 0)
    const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0
    const countries = new Set(all.map((a) => a.country as string)).size
    return { total: all.length, verified, avgRating, countries }
  }, [data])

  const countries = useMemo(() => {
    const all = (data?.portAgents ?? []) as Array<Record<string, unknown>>
    return [...new Set(all.map((a) => a.country as string))].filter(Boolean).sort()
  }, [data])

  const handleSearch = (q: string) => {
    setSearch(q)
    if (q.length >= 2) {
      searchAgents({ variables: { query: q } })
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createAgent({
      variables: {
        companyName: form.companyName,
        contactPerson: form.contactPerson,
        email: form.email,
        phone: form.phone || null,
        country: form.country,
        city: form.city,
        serviceTypes: form.serviceTypes,
        licenseNumber: form.licenseNumber || null,
      },
    })
    setForm(emptyForm)
    setShowCreate(false)
    refetch()
  }

  const handleVerify = async (id: string) => {
    if (!confirm('Verify this port agent?')) return
    await verifyAgent({ variables: { id } })
    refetch()
  }

  const toggleFormServiceType = (type: string) => {
    setForm((f) => ({
      ...f,
      serviceTypes: f.serviceTypes.includes(type)
        ? f.serviceTypes.filter((t) => t !== type)
        : [...f.serviceTypes, type],
    }))
  }

  const toggleFilterServiceType = (type: string) => {
    setFilterServiceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Port Agent Directory</h1>
          <p className="text-maritime-400 text-sm mt-1">
            {stats.total} agents registered worldwide
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Quick search agents..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64"
          />
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ Add Agent</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Agents', value: stats.total, color: 'text-white', border: 'border-blue-500' },
          { label: 'Verified', value: stats.verified, color: 'text-green-400', border: 'border-green-500' },
          { label: 'Avg Rating', value: stats.avgRating.toFixed(1), color: 'text-yellow-400', border: 'border-yellow-500' },
          { label: 'Countries', value: stats.countries, color: 'text-blue-400', border: 'border-blue-500' },
        ].map((s) => (
          <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
            <p className="text-maritime-500 text-xs">{s.label}</p>
            <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-maritime-500 text-[10px] mb-1">Country</label>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="bg-maritime-900 border border-maritime-600 rounded-md px-3 py-1.5 text-white text-sm"
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-maritime-500 text-[10px] mb-1">City</label>
            <input
              type="text"
              placeholder="Filter by city..."
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="bg-maritime-900 border border-maritime-600 rounded-md px-3 py-1.5 text-white text-sm w-40"
            />
          </div>
          <div>
            <label className="block text-maritime-500 text-[10px] mb-1">Service Types</label>
            <div className="flex gap-1">
              {serviceTypeOptions.map((st) => (
                <button
                  key={st.value}
                  onClick={() => toggleFilterServiceType(st.value)}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${
                    filterServiceTypes.includes(st.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-maritime-700 text-maritime-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-maritime-500 text-[10px] mb-1">Min Rating: {filterMinRating}</label>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={filterMinRating}
              onChange={(e) => setFilterMinRating(Number(e.target.value))}
              className="w-24 accent-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 pt-3">
            <input
              type="checkbox"
              id="verified-only"
              checked={filterVerifiedOnly}
              onChange={(e) => setFilterVerifiedOnly(e.target.checked)}
              className="accent-green-500"
            />
            <label htmlFor="verified-only" className="text-maritime-300 text-xs">Verified Only</label>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {(loading || searchLoading) && <p className="text-maritime-400">Loading agents...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Table */}
      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-left px-4 py-3 font-medium">Contact</th>
                <th className="text-left px-4 py-3 font-medium">Location</th>
                <th className="text-left px-4 py-3 font-medium">Services</th>
                <th className="text-center px-4 py-3 font-medium">Rating</th>
                <th className="text-right px-4 py-3 font-medium">Jobs</th>
                <th className="text-right px-4 py-3 font-medium">Resp. Time</th>
                <th className="text-center px-4 py-3 font-medium">Verified</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium text-xs">{a.companyName as string}</p>
                    {a.licenseNumber && (
                      <p className="text-maritime-500 text-[10px] font-mono mt-0.5">
                        Lic: {a.licenseNumber as string}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-maritime-300 text-xs">{a.contactPerson as string}</p>
                    <p className="text-maritime-500 text-[10px]">{a.email as string}</p>
                    {a.phone && <p className="text-maritime-500 text-[10px]">{a.phone as string}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-maritime-300 text-xs">{a.city as string}</p>
                    <p className="text-maritime-500 text-[10px]">{a.country as string}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {((a.serviceTypes as string[]) ?? []).map((st) => (
                        <span
                          key={st}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${serviceTypeBadge[st] ?? 'bg-maritime-700 text-maritime-300'}`}
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Stars rating={a.rating as number} />
                      <span className="text-maritime-300 text-xs ml-1">
                        {(a.rating as number)?.toFixed(1) ?? '0.0'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">
                    {(a.totalJobs as number)?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">
                    {(a.avgResponseHrs as number) != null
                      ? `${(a.avgResponseHrs as number).toFixed(1)}h`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {a.isVerified ? (
                      <span className="text-green-400 text-sm" title="Verified">&#10003;</span>
                    ) : (
                      <span className="text-maritime-600 text-sm" title="Unverified">&#9675;</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button className="text-blue-400 hover:text-blue-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded">
                        View
                      </button>
                      <button className="text-yellow-400 hover:text-yellow-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded">
                        Edit
                      </button>
                      {!a.isVerified && (
                        <button
                          onClick={() => handleVerify(a.id as string)}
                          className="text-green-400 hover:text-green-300 text-[10px] bg-green-900/30 px-1.5 py-0.5 rounded"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {agents.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No agents found</p>
          )}
        </div>
      )}

      {/* Create Agent Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Port Agent">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Company Name *">
              <input value={form.companyName} onChange={set('companyName')} className={inputClass} required placeholder="Pacific Marine Services" />
            </FormField>
            <FormField label="Contact Person *">
              <input value={form.contactPerson} onChange={set('contactPerson')} className={inputClass} required placeholder="John Smith" />
            </FormField>
            <FormField label="Email *">
              <input type="email" value={form.email} onChange={set('email')} className={inputClass} required placeholder="john@pacific-marine.com" />
            </FormField>
            <FormField label="Phone">
              <input value={form.phone} onChange={set('phone')} className={inputClass} placeholder="+65 9876 5432" />
            </FormField>
            <FormField label="Country *">
              <input value={form.country} onChange={set('country')} className={inputClass} required placeholder="Singapore" />
            </FormField>
            <FormField label="City *">
              <input value={form.city} onChange={set('city')} className={inputClass} required placeholder="Singapore" />
            </FormField>
          </div>
          <FormField label="Service Types *">
            <div className="flex flex-wrap gap-2">
              {serviceTypeOptions.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => toggleFormServiceType(st.value)}
                  className={`text-xs px-3 py-1.5 rounded transition-colors border ${
                    form.serviceTypes.includes(st.value)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-maritime-900 border-maritime-600 text-maritime-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="License Number">
            <input value={form.licenseNumber} onChange={set('licenseNumber')} className={inputClass} placeholder="AGT-SG-20260001" />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating || form.serviceTypes.length === 0} className={btnPrimary}>
              {creating ? 'Creating...' : 'Add Agent'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
