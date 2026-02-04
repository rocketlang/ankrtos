import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const CONTACTS_QUERY = gql`
  query Contacts($companyId: String) {
    contacts(companyId: $companyId) {
      id firstName lastName email phone mobile role designation isPrimary companyId
      company { id name type }
    }
  }
`;

const COMPANIES_QUERY = gql`
  query CompaniesForContact { companies { id name type } }
`;

const CREATE_CONTACT = gql`
  mutation CreateContact(
    $companyId: String!, $firstName: String!, $lastName: String!,
    $email: String, $phone: String, $mobile: String,
    $role: String, $designation: String, $isPrimary: Boolean
  ) {
    createContact(
      companyId: $companyId, firstName: $firstName, lastName: $lastName,
      email: $email, phone: $phone, mobile: $mobile,
      role: $role, designation: $designation, isPrimary: $isPrimary
    ) { id }
  }
`;

const DELETE_CONTACT = gql`
  mutation DeleteContact($id: String!) { deleteContact(id: $id) { id } }
`;

const roleColors: Record<string, string> = {
  operations: 'bg-blue-900/50 text-blue-400',
  chartering: 'bg-purple-900/50 text-purple-400',
  broking: 'bg-indigo-900/50 text-indigo-400',
  agency: 'bg-green-900/50 text-green-400',
  bunkers: 'bg-orange-900/50 text-orange-400',
  finance: 'bg-yellow-900/50 text-yellow-400',
  legal: 'bg-red-900/50 text-red-400',
};

const roles = ['operations', 'chartering', 'broking', 'agency', 'bunkers', 'finance', 'legal', 'management'];
const emptyForm = { companyId: '', firstName: '', lastName: '', email: '', phone: '', mobile: '', role: '', designation: '', isPrimary: false };

export function Contacts() {
  const { data, loading, error, refetch } = useQuery(CONTACTS_QUERY);
  const { data: companiesData } = useQuery(COMPANIES_QUERY);
  const [createContact, { loading: creating }] = useMutation(CREATE_CONTACT);
  const [deleteContact] = useMutation(DELETE_CONTACT);
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const contacts = (data?.contacts ?? []).filter(
    (c: { firstName: string; lastName: string; email?: string; role?: string; company: { id: string; name: string } }) => {
      const text = `${c.firstName} ${c.lastName} ${c.email ?? ''} ${c.role ?? ''} ${c.company.name}`.toLowerCase();
      const matchSearch = text.includes(search.toLowerCase());
      const matchCompany = companyFilter === 'all' || c.company.id === companyFilter;
      return matchSearch && matchCompany;
    },
  );

  const companies = companiesData?.companies ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createContact({
      variables: {
        companyId: form.companyId, firstName: form.firstName, lastName: form.lastName,
        email: form.email || null, phone: form.phone || null, mobile: form.mobile || null,
        role: form.role || null, designation: form.designation || null, isPrimary: form.isPrimary,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    await deleteContact({ variables: { id } });
    refetch();
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-maritime-400 text-sm mt-1">People across charterers, brokers, agents &amp; suppliers</p>
        </div>
        <div className="flex gap-3">
          <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
            <option value="all">All Companies</option>
            {companies.map((c: { id: string; name: string }) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input type="text" placeholder="Search contacts..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64" />
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ Add Contact</button>
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading contacts...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-left border-b border-maritime-700">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Designation</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c: Record<string, unknown>) => (
                <tr key={c.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white font-medium">
                    {c.firstName as string} {c.lastName as string}
                    {(c.isPrimary as boolean) && (
                      <span className="ml-2 px-1.5 py-0.5 bg-yellow-900/50 text-yellow-400 text-[10px] rounded">PRIMARY</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-maritime-300">
                    {(c.company as { name: string }).name}
                  </td>
                  <td className="px-4 py-3">
                    {c.role ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[c.role as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                        {(c.role as string)}
                      </span>
                    ) : <span className="text-maritime-600">-</span>}
                  </td>
                  <td className="px-4 py-3 text-maritime-400">{(c.designation as string) || '-'}</td>
                  <td className="px-4 py-3 text-maritime-400">{(c.email as string) || '-'}</td>
                  <td className="px-4 py-3 text-maritime-400">{(c.phone as string) || (c.mobile as string) || '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(c.id as string)}
                      className="text-red-500 hover:text-red-400 text-xs">Delete</button>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-maritime-500">No contacts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Contact">
        <form onSubmit={handleCreate}>
          <FormField label="Company *">
            <select value={form.companyId} onChange={set('companyId')} className={selectClass} required>
              <option value="">Select company...</option>
              {companies.map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name *">
              <input value={form.firstName} onChange={set('firstName')} className={inputClass} required />
            </FormField>
            <FormField label="Last Name *">
              <input value={form.lastName} onChange={set('lastName')} className={inputClass} required />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email">
              <input type="email" value={form.email} onChange={set('email')} className={inputClass} />
            </FormField>
            <FormField label="Phone">
              <input value={form.phone} onChange={set('phone')} className={inputClass} placeholder="+91 98765 43210" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Role">
              <select value={form.role} onChange={set('role')} className={selectClass}>
                <option value="">Select role...</option>
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
            <FormField label="Designation">
              <input value={form.designation} onChange={set('designation')} className={inputClass} placeholder="Senior Charterer" />
            </FormField>
          </div>
          <FormField label="">
            <label className="flex items-center gap-2 text-maritime-300 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isPrimary} onChange={set('isPrimary')} className="rounded" />
              Primary contact for this company
            </label>
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
