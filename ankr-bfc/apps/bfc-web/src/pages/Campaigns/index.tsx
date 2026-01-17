/**
 * Campaigns Page
 */

import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  BarChart2,
  Users,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/ui';

const campaigns = [
  {
    id: 1,
    name: 'Q1 Personal Loan Push',
    type: 'LOAN',
    status: 'ACTIVE',
    target: 'Mass Affluent',
    reach: 8500,
    conversions: 342,
    conversionRate: 4.02,
    startDate: '2024-01-01',
    endDate: '2024-03-31',
  },
  {
    id: 2,
    name: 'Premium Credit Card',
    type: 'CARD',
    status: 'ACTIVE',
    target: 'Premium',
    reach: 3200,
    conversions: 256,
    conversionRate: 8.0,
    startDate: '2024-01-15',
    endDate: '2024-02-28',
  },
  {
    id: 3,
    name: 'FD Rate Special',
    type: 'DEPOSIT',
    status: 'PAUSED',
    target: 'All Segments',
    reach: 15000,
    conversions: 1200,
    conversionRate: 8.0,
    startDate: '2024-01-10',
    endDate: '2024-01-31',
  },
  {
    id: 4,
    name: 'Insurance Cross-sell',
    type: 'INSURANCE',
    status: 'DRAFT',
    target: 'High LTV',
    reach: 0,
    conversions: 0,
    conversionRate: 0,
    startDate: '2024-02-01',
    endDate: '2024-04-30',
  },
];

const statusColors: Record<string, 'success' | 'warning' | 'default'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  DRAFT: 'default',
  COMPLETED: 'info',
};

export function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const avgConversionRate = totalReach > 0 ? (totalConversions / totalReach) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-slate-500 mt-1">Manage marketing and offer campaigns</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" />
          Create Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Active Campaigns</p>
                <p className="text-xl font-bold text-slate-900">
                  {campaigns.filter((c) => c.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Reach</p>
                <p className="text-xl font-bold text-slate-900">{totalReach.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Conversions</p>
                <p className="text-xl font-bold text-slate-900">{totalConversions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Avg. Conversion Rate</p>
                <p className="text-xl font-bold text-slate-900">{avgConversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
                  <p className="text-sm text-slate-500">{campaign.type}</p>
                </div>
                <Badge variant={statusColors[campaign.status] as any}>{campaign.status}</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Target Segment</span>
                  <span className="font-medium text-slate-900">{campaign.target}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Reach</span>
                  <span className="font-medium text-slate-900">{campaign.reach.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Conversions</span>
                  <span className="font-medium text-slate-900">{campaign.conversions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Conversion Rate</span>
                  <span className="font-medium text-green-600">{campaign.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Duration</span>
                  <span className="text-slate-600">
                    {campaign.startDate} - {campaign.endDate}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200">
                {campaign.status === 'ACTIVE' && (
                  <Button variant="outline" size="sm" className="flex-1">
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                )}
                {campaign.status === 'PAUSED' && (
                  <Button variant="outline" size="sm" className="flex-1">
                    <Play className="w-4 h-4" />
                    Resume
                  </Button>
                )}
                {campaign.status === 'DRAFT' && (
                  <Button size="sm" className="flex-1">
                    <Play className="w-4 h-4" />
                    Launch
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  <BarChart2 className="w-4 h-4" />
                  Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
