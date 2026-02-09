import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { useMutation, gql } from '@apollo/client';
import { useAuthStore } from '../lib/stores/auth';
import { useNavigate } from 'react-router-dom';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
        role
        organizationId
      }
    }
  }
`;

export function Login() {
  const [email, setEmail] = useState('admin@ankr.in');
  const [password, setPassword] = useState('admin123');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const [loginMutation, { loading, error }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      console.log('Login successful:', data);
      login(data.login.user, data.login.token);
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password: '***' });
    loginMutation({ variables: { email, password } })
      .catch(err => console.error('Login mutation error:', err));
  };

  return (
    <div className="min-h-screen bg-maritime-900 flex items-center justify-center">
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">&#x2693;</span>
          <h1 className="text-2xl font-bold text-white mt-2">Mari8x</h1>
          <p className="text-maritime-400 text-sm mt-1">Maritime Operations Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-maritime-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-maritime-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error.message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 space-y-2">
          <div className="text-xs text-center text-maritime-400">
            <p className="font-semibold mb-2">Quick Login:</p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@ankr.in');
                  setPassword('admin123');
                }}
                className="block w-full text-left px-3 py-1.5 bg-maritime-800/50 hover:bg-maritime-700/50 rounded border border-maritime-600 transition-colors"
              >
                <span className="text-blue-400">👑 Admin</span>
                <span className="text-maritime-500 ml-2">- Full Access</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('demo@mari8x.com');
                  setPassword('demo123');
                }}
                className="block w-full text-left px-3 py-1.5 bg-maritime-800/50 hover:bg-maritime-700/50 rounded border border-maritime-600 transition-colors"
              >
                <span className="text-green-400">👁️ Demo</span>
                <span className="text-maritime-500 ml-2">- Limited Access</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
