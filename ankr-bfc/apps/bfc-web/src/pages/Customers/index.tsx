/**
 * Customers List Page
 */

import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Plus, ChevronRight } from 'lucide-react';
import { Card, CardContent, Button, Badge } from '../../components/ui';
import { useQuery } from '@apollo/client';
import { SEARCH_CUSTOMERS } from '../../lib/graphql';

// Mock data for demo
const mockCustomers = [
  {
    id: '1',
    firstName: 'Rahul',
    lastName: 'Sharma',
    email: 'r***a@example.com',
    phone: 'XXXXXX3210',
    segment: 'PREMIUM',
    riskScore: 0.25,
    kycStatus: 'VERIFIED',
  },
  {
    id: '2',
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'p***a@example.com',
    phone: 'XXXXXX3211',
    segment: 'AFFLUENT',
    riskScore: 0.35,
    kycStatus: 'VERIFIED',
  },
  {
    id: '3',
    firstName: 'Amit',
    lastName: 'Kumar',
    email: 'a***t@example.com',
    phone: 'XXXXXX3212',
    segment: 'MASS_AFFLUENT',
    riskScore: 0.55,
    kycStatus: 'PENDING',
  },
  {
    id: '4',
    firstName: 'Neha',
    lastName: 'Singh',
    email: 'n***a@example.com',
    phone: 'XXXXXX3213',
    segment: 'MASS',
    riskScore: 0.65,
    kycStatus: 'VERIFIED',
  },
  {
    id: '5',
    firstName: 'Vikram',
    lastName: 'Reddy',
    email: 'v***m@example.com',
    phone: 'XXXXXX3214',
    segment: 'PREMIUM',
    riskScore: 0.15,
    kycStatus: 'VERIFIED',
  },
];

const segmentColors: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
  PREMIUM: 'info',
  AFFLUENT: 'success',
  MASS_AFFLUENT: 'warning',
  MASS: 'default',
};

const kycColors: Record<string, 'success' | 'warning' | 'error'> = {
  VERIFIED: 'success',
  PENDING: 'warning',
  REJECTED: 'error',
};

export function CustomersPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  // In real app, would use GraphQL query
  // const { data, loading } = useQuery(SEARCH_CUSTOMERS, { variables: { query: { name: searchQuery } } });
  const customers = mockCustomers;

  const filteredCustomers = customers.filter((c) => {
    if (selectedSegment && c.segment !== selectedSegment) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        c.firstName.toLowerCase().includes(query) ||
        c.lastName.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Manage and view all customers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button>
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedSegment || ''}
              onChange={(e) => setSelectedSegment(e.target.value || null)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Segments</option>
              <option value="PREMIUM">Premium</option>
              <option value="AFFLUENT">Affluent</option>
              <option value="MASS_AFFLUENT">Mass Affluent</option>
              <option value="MASS">Mass</option>
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Segment
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  KYC Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                        {customer.firstName.charAt(0)}
                        {customer.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-sm text-slate-500">ID: {customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">{customer.email}</p>
                    <p className="text-sm text-slate-500">{customer.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={segmentColors[customer.segment]}>
                      {customer.segment.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            customer.riskScore < 0.3
                              ? 'bg-green-500'
                              : customer.riskScore < 0.6
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${customer.riskScore * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600">
                        {(customer.riskScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={kycColors[customer.kycStatus]}>{customer.kycStatus}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm">
                      View
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
