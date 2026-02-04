/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WowTruck 2.0 - Login Page
 * Enhanced with permissions and refreshToken support
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Truck, Eye, EyeOff, AlertCircle, Shield, Loader2 } from 'lucide-react';
import { useAuth, ROLE_LABELS } from '../contexts/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════
// GraphQL Mutation - Now includes refreshToken and permissions
// ═══════════════════════════════════════════════════════════════════════════

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      refreshToken
      user {
        id
        name
        email
        phone
        role
        permissions
        branchId
        branch {
          id
          name
          code
        }
      }
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// Demo Accounts for testing
// ═══════════════════════════════════════════════════════════════════════════

const DEMO_ACCOUNTS = [
  { email: 'admin@wowtruck.com', password: 'Admin@123', role: 'super_admin' },
  { email: 'dispatch@wowtruck.com', password: 'Dispatch@123', role: 'dispatcher' },
  { email: 'driver@wowtruck.com', password: 'Driver@123', role: 'driver' },
  { email: 'customer@wowtruck.com', password: 'Customer@123', role: 'customer' },
];

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const { token, refreshToken, user } = data.login;
      console.log('✅ Login response:', { user: user.email, role: user.role, permissions: user.permissions?.length });
      login(token, refreshToken || '', user);
    },
    onError: (err) => {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    loginMutation({ variables: { email, password } });
  };

  const fillDemoAccount = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">WowTruck 2.0</h1>
          <p className="text-gray-400 mt-2">Transport Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-gray-700/50">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-400">Secured by ANKR Auth</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-3">Quick Login (Demo Accounts):</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  onClick={() => fillDemoAccount(account)}
                  className="px-3 py-2 text-xs bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:text-white transition-all text-left"
                >
                  <div className="font-medium">{ROLE_LABELS[account.role as keyof typeof ROLE_LABELS] || account.role}</div>
                  <div className="text-gray-500 truncate">{account.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          🙏 Jai Guru Ji | © 2025 ANKR Labs + WowTruck Technologies
        </p>
      </div>
    </div>
  );
}
