import React from 'react';
import ReactDOM from 'react-dom/client';
import { BFCProvider } from '@ankr-bfc/api-client';
import { App } from './App';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4020/graphql';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4020/graphql';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BFCProvider
      apiUrl={API_URL}
      wsUrl={WS_URL}
      getToken={() => localStorage.getItem('bfc_token')}
      onAuthError={() => {
        localStorage.removeItem('bfc_token');
        window.location.href = '/login';
      }}
    >
      <App />
    </BFCProvider>
  </React.StrictMode>
);
