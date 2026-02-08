import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth endpoints
export const authAPI = {
  register: (email: string, password: string, username: string) =>
    api.post('/auth/register', { email, password, username }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
}

// Challenge endpoints
export const challengeAPI = {
  getNext: () => api.get('/challenges/next'),

  submit: (challengeId: string, response: string) =>
    api.post('/challenges/submit', { challengeId, response }),

  getHistory: () => api.get('/challenges/history'),
}

// Verification endpoints
export const verificationAPI = {
  getStatus: () => api.get('/verification/status'),

  requestCertificate: () => api.post('/verification/request-certificate'),

  verifyCertificate: (certificateHash: string) =>
    api.get(`/verification/verify/${certificateHash}`),

  getBadge: (username: string) =>
    api.get(`/verification/badge/${username}`),
}

export default api
