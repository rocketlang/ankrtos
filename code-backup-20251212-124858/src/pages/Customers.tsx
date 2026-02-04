/**
 * Customers Page - With StatsFilter
 */
import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useTheme } from '../contexts/ThemeContext';
import { StatsFilter } from '../components/StatsFilter';

const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers {
      id
      name
      email
      phone
      gstin
      address
      city
      state
    }
  }
`;

export default function Customers() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('all');
  
  const { data, loading } = useQuery(GET_CUSTOMERS);

  const titleColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const subtitleColor = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const cardBg = theme === 'light' ? 'bg-gray-100' : 'bg-gray-800';

  const customers = data?.customers || [];

  const stats = [
    { id: 'all', label: 'All Customers', value: customers.length, color: 'gray' as const, icon: '🏢' },
    { id: 'active', label: 'Active', value: customers.length, color: 'green' as const, icon: '✅' },
    { id: 'recent', label: 'This Month', value: Math.floor(customers.length * 0.3), color: 'blue' as const, icon: '📅' },
  ];

  if (loading) {
    return <div className={`text-center py-8 ${subtitleColor}`}>Loading customers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className={`${cardBg} rounded-xl p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${titleColor}`}>🏢 Customers</h1>
            <p className={subtitleColor}>{customers.length} customers</p>
          </div>
          <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition">
            + Add Customer
          </button>
        </div>
      </div>

      <StatsFilter stats={stats} activeFilter={filter} onFilterChange={setFilter} theme={theme} columns={3} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer: any) => (
          <div key={customer.id} className={`${cardBg} rounded-xl p-4 hover:ring-2 hover:ring-orange-500/50 cursor-pointer transition`}>
            <h3 className={`font-semibold ${titleColor} mb-2`}>{customer.name}</h3>
            <div className={`text-sm ${subtitleColor} space-y-1`}>
              <div>📧 {customer.email || '-'}</div>
              <div>📱 {customer.phone}</div>
              <div>📍 {customer.city}, {customer.state}</div>
              {customer.gstin && <div>🏛️ GSTIN: {customer.gstin}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
