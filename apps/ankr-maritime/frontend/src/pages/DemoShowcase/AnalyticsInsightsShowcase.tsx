import { useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

// GraphQL Queries
const ANALYTICS_DATA = gql`
  query AnalyticsShowcaseData {
    cargoEnquiries {
      id
      reference
      cargoType
      quantity
      rateIndication
      rateUnit
      status
      receivedAt
      loadPort {
        unlocode
        name
        country
      }
      dischargePort {
        unlocode
        name
        country
      }
    }
    charters {
      id
      reference
      status
      freightRate
      freightUnit
      fixtureDate
      notes
      vessel {
        name
      }
      charterer {
        name
      }
    }
    customerProfiles {
      id
      companyName
      totalFixtures
      totalRevenue
      avgFixtureValue
      creditRating
      relationshipScore
      lastFixtureDate
      outstandingAmount
      avgPaymentDays
      riskFlags
    }
  }
`;

interface Enquiry {
  id: string;
  reference: string;
  cargoType: string;
  quantity: number;
  route: string;
  status: string;
  value: number;
  receivedAt: string;
}

interface Charter {
  id: string;
  reference: string;
  vessel: string;
  charterer: string;
  cargo: string;
  quantity: number;
  freightRate: number;
  commission: number;
  status: string;
  revenue: number;
  commissionAmount: number;
}

interface CustomerMetric {
  id: string;
  companyName: string;
  totalFixtures: number;
  totalRevenue: number;
  avgMargin: number;
  creditRating: 'A' | 'B' | 'C' | 'D';
  relationshipScore: number;
  lastFixtureDate: string;
  outstandingAmount: number;
  avgPaymentDays: number;
  riskFlags: string[];
}

export default function AnalyticsInsightsShowcase() {
  const [activeSection, setActiveSection] = useState<'pipeline' | 'commission' | 'customers'>('pipeline');

  const { data, loading, error } = useQuery(ANALYTICS_DATA);

  // Transform data
  const enquiries: Enquiry[] = useMemo(() => {
    if (!data?.cargoEnquiries) return [];

    return data.cargoEnquiries.map((e: any) => ({
      id: e.id,
      reference: e.reference,
      cargoType: e.cargoType,
      quantity: e.quantity,
      route: `${e.loadPort?.name || 'Unknown'} → ${e.dischargePort?.name || 'Unknown'}`,
      status: mapEnquiryStatus(e.status),
      value: (e.rateIndication || 0) * e.quantity,
      receivedAt: e.receivedAt,
    }));
  }, [data]);

  const charters: Charter[] = useMemo(() => {
    if (!data?.charters) return [];

    return data.charters.map((c: any) => {
      // Extract commission from notes (format: "... X% commission = $Y")
      const commissionMatch = c.notes?.match(/(\d+\.?\d*)%\s+commission\s+=\s+\$(\d+,?\d*)/);
      const commission = commissionMatch ? parseFloat(commissionMatch[1]) : 2.5;
      const commissionAmount = commissionMatch ? parseFloat(commissionMatch[2].replace(/,/g, '')) : 0;

      // Extract cargo and quantity from notes
      const cargoMatch = c.notes?.match(/^([^-]+)-/);
      const quantityMatch = c.notes?.match(/(\d+,?\d*)\s+MT/);
      const revenueMatch = c.notes?.match(/\$(\d+,?\d*)\/MT/);

      const quantity = quantityMatch ? parseInt(quantityMatch[1].replace(/,/g, '')) : 0;
      const revenue = revenueMatch ? parseInt(revenueMatch[1].replace(/,/g, '')) * quantity : (c.freightRate || 0) * quantity;

      return {
        id: c.id,
        reference: c.reference,
        vessel: c.vessel?.name || 'Unknown',
        charterer: c.charterer?.name || 'Unknown',
        cargo: cargoMatch ? cargoMatch[1].trim() : 'Cargo',
        quantity,
        freightRate: c.freightRate || 0,
        commission,
        status: c.status,
        revenue,
        commissionAmount,
      };
    });
  }, [data]);

  const customers: CustomerMetric[] = useMemo(() => {
    if (!data?.customerProfiles) return [];

    return data.customerProfiles.map((c: any) => ({
      id: c.id,
      companyName: c.companyName,
      totalFixtures: c.totalFixtures,
      totalRevenue: c.totalRevenue,
      avgMargin: ((c.totalRevenue / (c.totalFixtures || 1)) / (c.avgFixtureValue || 1)) * 100,
      creditRating: c.creditRating || 'C',
      relationshipScore: c.relationshipScore || 50,
      lastFixtureDate: c.lastFixtureDate,
      outstandingAmount: c.outstandingAmount || 0,
      avgPaymentDays: c.avgPaymentDays || 0,
      riskFlags: c.riskFlags || [],
    }));
  }, [data]);

  // Helper function to map enquiry status
  function mapEnquiryStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'open': 'new',
      'working': 'working',
      'covered': 'fixed',
      'executing': 'executing',
      'complete': 'complete',
      'expired': 'lost',
      'withdrawn': 'lost',
    };
    return statusMap[status] || status;
  }

  // Calculate metrics
  const pipelineValue = enquiries.reduce((sum, e) => sum + e.value, 0);
  const totalCommission = charters.reduce((sum, c) => sum + c.commissionAmount, 0);
  const conversionRate = enquiries.length > 0 ? (charters.filter(c => c.status === 'completed').length / enquiries.length) * 100 : 0;
  const activeCustomers = customers.length;

  // Pipeline funnel
  const pipelineStages = useMemo(() => {
    const stages = ['new', 'working', 'fixed', 'executing', 'complete'];
    return stages.map(stage => ({
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: enquiries.filter(e => e.status === stage).length,
      value: enquiries.filter(e => e.status === stage).reduce((sum, e) => sum + e.value, 0),
    }));
  }, [enquiries]);

  const lostDeals = enquiries.filter(e => e.status === 'lost').length;
  const lostValue = enquiries.filter(e => e.status === 'lost').reduce((sum, e) => sum + e.value, 0);

  if (loading) {
    return (
      <ShowcaseLayout
        title="Analytics & Insights"
        description="Real-time business intelligence with pipeline tracking, commission analytics, and customer profitability"
        features={[
          '📊 Pipeline funnel visualization',
          '💰 Commission income tracking',
          '👥 Customer profitability analysis',
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ShowcaseLayout>
    );
  }

  if (error) {
    return (
      <ShowcaseLayout
        title="Analytics & Insights"
        description="Real-time business intelligence"
        features={[]}
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">Error loading analytics data: {error.message}</p>
          <p className="text-sm text-red-500 mt-2">Please ensure the backend server is running and the database is seeded.</p>
        </div>
      </ShowcaseLayout>
    );
  }

  if (enquiries.length === 0 && charters.length === 0 && customers.length === 0) {
    return (
      <ShowcaseLayout
        title="Analytics & Insights"
        description="Real-time business intelligence"
        features={[]}
      >
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800 font-medium">No demo data available</p>
          <p className="text-sm text-yellow-600 mt-2">
            Run the seed script to populate demo data: <code className="bg-yellow-100 px-2 py-1 rounded">npx tsx scripts/seed-demo-showcase.ts</code>
          </p>
        </div>
      </ShowcaseLayout>
    );
  }

  return (
    <ShowcaseLayout
      title="Analytics & Insights"
      description="Real-time business intelligence with pipeline tracking, commission analytics, and customer profitability"
      features={[
        '📊 Pipeline funnel with conversion tracking',
        '💰 Commission income analytics',
        '👥 Customer profitability scoring',
        '⚡ Real-time data from database',
      ]}
    >
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
            <div className="text-blue-100 text-sm font-medium mb-1">Pipeline Value</div>
            <div className="text-3xl font-bold">${(pipelineValue / 1000000).toFixed(1)}M</div>
            <div className="text-blue-200 text-xs mt-2">{enquiries.length} enquiries</div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg">
            <div className="text-green-100 text-sm font-medium mb-1">Total Commission</div>
            <div className="text-3xl font-bold">${(totalCommission / 1000).toFixed(1)}K</div>
            <div className="text-green-200 text-xs mt-2">{charters.length} charters</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
            <div className="text-purple-100 text-sm font-medium mb-1">Conversion Rate</div>
            <div className="text-3xl font-bold">{conversionRate.toFixed(0)}%</div>
            <div className="text-purple-200 text-xs mt-2">Enquiry to fixture</div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white shadow-lg">
            <div className="text-orange-100 text-sm font-medium mb-1">Active Customers</div>
            <div className="text-3xl font-bold">{activeCustomers}</div>
            <div className="text-orange-200 text-xs mt-2">Profitability tracked</div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          {[
            { id: 'pipeline' as const, label: 'Pipeline Funnel', icon: '📊' },
            { id: 'commission' as const, label: 'Commission Income', icon: '💰' },
            { id: 'customers' as const, label: 'Customer Insights', icon: '👥' },
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeSection === section.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>

        {/* Pipeline Funnel */}
        {activeSection === 'pipeline' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-6">Sales Pipeline - Conversion Funnel</h3>

              <div className="space-y-4">
                {pipelineStages.map((stage, idx) => {
                  const percentage = pipelineValue > 0 ? (stage.value / pipelineValue) * 100 : 0;
                  const maxWidth = 100 - (idx * 10); // Funnel effect

                  return (
                    <div key={stage.stage} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-700">{stage.stage}</div>
                        <div className="text-sm text-gray-500">{stage.count} enquiries</div>
                      </div>

                      <div
                        className="bg-gray-100 rounded-lg h-16 relative overflow-hidden"
                        style={{ width: `${maxWidth}%` }}
                      >
                        <div
                          className={`h-full flex items-center justify-between px-4 transition-all ${
                            idx === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                            idx === 1 ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' :
                            idx === 2 ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                            idx === 3 ? 'bg-gradient-to-r from-violet-500 to-violet-600' :
                            'bg-gradient-to-r from-green-500 to-green-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-white font-semibold">${(stage.value / 1000000).toFixed(2)}M</span>
                          <span className="text-white text-sm">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Lost Deals */}
              {lostDeals > 0 && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-red-900 font-medium">Lost Deals</div>
                      <div className="text-red-600 text-sm">{lostDeals} enquiries lost</div>
                    </div>
                    <div className="text-red-900 font-bold text-lg">
                      -${(lostValue / 1000000).toFixed(2)}M
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Commission Income */}
        {activeSection === 'commission' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Commission Income Breakdown</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Charter</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vessel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Charterer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Comm %</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {charters.map((charter) => (
                      <tr key={charter.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {charter.reference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {charter.vessel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {charter.charterer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {charter.cargo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          ${charter.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                          {charter.commission.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                          ${charter.commissionAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            charter.status === 'completed' ? 'bg-green-100 text-green-800' :
                            charter.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {charter.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                        TOTAL COMMISSION:
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">
                        ${totalCommission.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Customer Insights */}
        {activeSection === 'customers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Customer Profitability Analysis</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Relationship scoring and credit risk assessment
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fixtures</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Payment Days</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Credit</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Flags</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{customer.companyName}</div>
                          <div className="text-xs text-gray-500">Last: {new Date(customer.lastFixtureDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {customer.totalFixtures}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          ${(customer.totalRevenue / 1000000).toFixed(2)}M
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                          {customer.avgPaymentDays} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={customer.outstandingAmount > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}>
                            ${(customer.outstandingAmount / 1000).toFixed(0)}K
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            customer.creditRating === 'A' ? 'bg-green-100 text-green-800' :
                            customer.creditRating === 'B' ? 'bg-blue-100 text-blue-800' :
                            customer.creditRating === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {customer.creditRating}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  customer.relationshipScore >= 80 ? 'bg-green-500' :
                                  customer.relationshipScore >= 60 ? 'bg-blue-500' :
                                  customer.relationshipScore >= 40 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${customer.relationshipScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                              {customer.relationshipScore}/100
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {customer.riskFlags.length > 0 ? (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                              {customer.riskFlags.length} ⚠️
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">📊 Key Performance Insights</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">Top Customer by Revenue</div>
                  <div className="font-semibold text-gray-900">
                    {customers.length > 0 ? customers[0].companyName : 'N/A'}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    ${customers.length > 0 ? (customers[0].totalRevenue / 1000000).toFixed(2) : 0}M total
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">High Risk Customers</div>
                  <div className="font-semibold text-gray-900">
                    {customers.filter(c => c.creditRating === 'D' || c.riskFlags.length > 0).length}
                  </div>
                  <div className="text-xs text-red-600 mt-1">Require monitoring</div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">Avg Payment Terms</div>
                  <div className="font-semibold text-gray-900">
                    {customers.length > 0 ? (customers.reduce((sum, c) => sum + c.avgPaymentDays, 0) / customers.length).toFixed(0) : 0} days
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Industry average: 45 days</div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">Total Outstanding</div>
                  <div className="font-semibold text-gray-900">
                    ${(customers.reduce((sum, c) => sum + c.outstandingAmount, 0) / 1000000).toFixed(2)}M
                  </div>
                  <div className="text-xs text-orange-600 mt-1">Follow-up required</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShowcaseLayout>
  );
}
