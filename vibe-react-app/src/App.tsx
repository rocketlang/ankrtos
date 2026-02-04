import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3000';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();
      setUsers(data.data);
      setError('');
    } catch (err) {
      setError('Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      setUsers([...users, data.data]);
      setName('');
      setEmail('');
      setError('');
    } catch (err) {
      setError('Failed to create user');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  return (
    <div className="app">
      <h1>🚀 vibe-react-app</h1>
      <p className="subtitle">Connected to vibe-api-server</p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={createUser} className="form">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button type="submit">Add User</button>
      </form>

      <h2>Users ({users.length})</h2>

      {loading ? (
        <p>Loading...</p>
      ) : users.length === 0 ? (
        <p className="empty">No users yet. Add one above!</p>
      ) : (
        <ul className="user-list">
          {users.map(user => (
            <li key={user.id} className="user-card">
              <div className="user-info">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <button onClick={() => deleteUser(user.id)} className="delete-btn">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
