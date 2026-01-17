/**
 * Customers Page with Real GraphQL Data
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Eye } from 'lucide-react';
import { useCustomers, useSearchCustomers } from '@ankr-bfc/api-client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  SearchInput,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableLoading,
  TableEmpty,
  Avatar,
  StatusBadge,
  SegmentBadge,
  RiskBadge,
} from '@ankr-bfc/ui';
import { formatDate, maskMobile } from '@ankr-bfc/utils';

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<{ segment?: string; kycStatus?: string }>({});

  const { data, loading, refetch } = useCustomers({
    variables: { filter, limit: 20, offset: 0 },
  });

  const { data: searchData, loading: searchLoading } = useSearchCustomers(search);

  const customers = search ? searchData?.searchCustomers : data?.customers?.items;
  const isLoading = search ? searchLoading : loading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">
            {data?.customers?.total?.toLocaleString() || 0} total customers
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>Add Customer</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <SearchInput
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
              />
            </div>
            <select
              className="h-10 px-3 rounded-lg border border-slate-300 text-sm"
              value={filter.segment || ''}
              onChange={(e) => setFilter({ ...filter, segment: e.target.value || undefined })}
            >
              <option value="">All Segments</option>
              <option value="Premium">Premium</option>
              <option value="Affluent">Affluent</option>
              <option value="Mass Affluent">Mass Affluent</option>
              <option value="Mass">Mass</option>
            </select>
            <select
              className="h-10 px-3 rounded-lg border border-slate-300 text-sm"
              value={filter.kycStatus || ''}
              onChange={(e) => setFilter({ ...filter, kycStatus: e.target.value || undefined })}
            >
              <option value="">All KYC Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoading rows={5} cols={7} />
            ) : customers?.length ? (
              customers.map((customer: any) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={customer.name} size="sm" />
                      <div>
                        <p className="font-medium text-slate-900">{customer.name}</p>
                        <p className="text-sm text-slate-500">{customer.customerId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-slate-900">{customer.email}</p>
                      <p className="text-sm text-slate-500">{maskMobile(customer.phone)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <SegmentBadge segment={customer.segment} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={customer.kycStatus} />
                  </TableCell>
                  <TableCell>
                    <RiskBadge score={customer.riskScore} />
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {formatDate(customer.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/customers/${customer.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableEmpty
                title="No customers found"
                description="Try adjusting your search or filters"
              />
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
