import { useState } from 'react';
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
      login(data.login.user, data.login.token);
      navigate('/');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation({ variables: { email, password } });
  };

  return (
    <div className="min-h-screen bg-maritime-900 flex items-center justify-center">
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">&#x2693;</span>
          <h1 className="text-2xl font-bold text-white mt-2">ankrMrk8X</h1>
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

        <p className="text-maritime-500 text-xs text-center mt-6">
          Default: admin@ankr.in / admin123
        </p>
      </div>
    </div>
  );
}
