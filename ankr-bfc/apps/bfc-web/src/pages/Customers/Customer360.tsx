/**
 * Customer 360 View
 */

import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Shield,
  TrendingUp,
  CreditCard,
  Clock,
  CheckCircle,
  AlertTriangle,
  Gift,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock data
const customer = {
  id: '1',
  firstName: 'Rahul',
  lastName: 'Sharma',
  email: 'r***a@example.com',
  phone: 'XXXXXX3210',
  pan: 'ABCPS****A',
  segment: 'PREMIUM',
  riskScore: 0.25,
  trustScore: 0.85,
  kycStatus: 'VERIFIED',
  ltv: 450000,
  tenure: 48,
  createdAt: '2020-03-15',
};

const metrics = {
  totalEpisodes: 156,
  successRate: 0.89,
  recentActivity: 12,
  productCount: 4,
};

const products = [
  { id: 1, type: 'SAVINGS', name: 'Premium Savings', status: 'ACTIVE', balance: '₹2,50,000' },
  { id: 2, type: 'CREDIT_CARD', name: 'Platinum Card', status: 'ACTIVE', balance: '₹45,000' },
  { id: 3, type: 'HOME_LOAN', name: 'Home Loan', status: 'ACTIVE', balance: '₹25,00,000' },
  { id: 4, type: 'FD', name: 'Tax Saver FD', status: 'ACTIVE', balance: '₹5,00,000' },
];

const episodes = [
  { id: 1, action: 'Loan EMI Paid', outcome: 'On Time', success: true, date: '2024-01-15' },
  { id: 2, action: 'Card Payment', outcome: 'Processed', success: true, date: '2024-01-12' },
  { id: 3, action: 'Support Query', outcome: 'Resolved', success: true, date: '2024-01-10' },
  { id: 4, action: 'Offer Shown', outcome: 'Clicked', success: true, date: '2024-01-08' },
  { id: 5, action: 'KYC Update', outcome: 'Verified', success: true, date: '2024-01-05' },
];

const offers = [
  { id: 1, type: 'PERSONAL_LOAN', title: 'Pre-approved Personal Loan', amount: '₹10,00,000', confidence: 0.92 },
  { id: 2, type: 'INSURANCE', title: 'Term Life Insurance', amount: '₹1Cr Cover', confidence: 0.78 },
];

const activityData = [
  { month: 'Aug', score: 0.72 },
  { month: 'Sep', score: 0.75 },
  { month: 'Oct', score: 0.78 },
  { month: 'Nov', score: 0.82 },
  { month: 'Dec', score: 0.84 },
  { month: 'Jan', score: 0.85 },
];

export function Customer360Page() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/customers')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-slate-500">Customer ID: {customer.id} • Since {customer.createdAt}</p>
        </div>
        <Badge variant="info" size="md">{customer.segment}</Badge>
        <Badge variant="success" size="md">{customer.kycStatus}</Badge>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Risk Score</p>
                <p className="text-xl font-bold text-slate-900">{(customer.riskScore * 100).toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Trust Score</p>
                <p className="text-xl font-bold text-slate-900">{(customer.trustScore * 100).toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Lifetime Value</p>
                <p className="text-xl font-bold text-slate-900">₹{(customer.ltv / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Tenure</p>
                <p className="text-xl font-bold text-slate-900">{customer.tenure} months</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trust Score Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Trust Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0.5, 1]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle>Active Products ({products.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-500">{product.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">{product.balance}</p>
                      <Badge variant="success" size="sm">{product.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Episodes */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200">
                {episodes.map((episode) => (
                  <div key={episode.id} className="flex items-center gap-4 px-6 py-4">
                    <div className={`p-2 rounded-full ${episode.success ? 'bg-green-100' : 'bg-red-100'}`}>
                      {episode.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{episode.action}</p>
                      <p className="text-sm text-slate-500">{episode.outcome}</p>
                    </div>
                    <p className="text-sm text-slate-500">{episode.date}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{customer.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">PAN: {customer.pan}</span>
              </div>
            </CardContent>
          </Card>

          {/* Personalized Offers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                Personalized Offers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {offers.map((offer) => (
                <div key={offer.id} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="info">{offer.type.replace('_', ' ')}</Badge>
                    <span className="text-xs text-slate-500">{(offer.confidence * 100).toFixed(0)}% match</span>
                  </div>
                  <p className="font-medium text-slate-900">{offer.title}</p>
                  <p className="text-sm text-purple-600 font-semibold mt-1">{offer.amount}</p>
                  <Button size="sm" className="w-full mt-3">
                    Present Offer
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Phone className="w-4 h-4" />
                Schedule Call
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="w-4 h-4" />
                Send Communication
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="w-4 h-4" />
                New Application
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
