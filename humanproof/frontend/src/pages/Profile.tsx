import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { verificationAPI, challengeAPI } from '../services/api'
import { Award, Calendar, TrendingUp, Shield } from 'lucide-react'

interface VerificationStatus {
  verified: boolean
  completedChallenges: number
  certificate: {
    id: string
    hash: string
    issued_at: number
    expires_at: number
    verification_level: string
    status: string
  } | null
}

interface ChallengeHistory {
  id: string
  type: string
  prompt: string
  response: string
  score: number
  status: string
  created_at: number
  completed_at: number
}

export default function Profile() {
  const { user } = useAuth()
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [history, setHistory] = useState<ChallengeHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statusRes, historyRes] = await Promise.all([
        verificationAPI.getStatus(),
        challengeAPI.getHistory(),
      ])
      setStatus(statusRes.data)
      setHistory(historyRes.data.challenges)
    } catch (error) {
      console.error('Failed to fetch profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    )
  }

  const completedChallenges = history.filter((c) => c.status === 'completed')
  const averageScore =
    completedChallenges.length > 0
      ? Math.round(
          completedChallenges.reduce((sum, c) => sum + c.score, 0) /
            completedChallenges.length
        )
      : 0

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="card mb-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{user?.username}</h1>
              <p className="text-primary-100">{user?.email}</p>
              {status?.verified && (
                <div className="mt-4 flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full inline-flex">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">Verified Human</span>
                </div>
              )}
            </div>
            {status?.verified && (
              <Award className="w-20 h-20 text-yellow-300" />
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Challenges Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {completedChallenges.length}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {averageScore}%
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Date(status?.certificate?.issued_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Display */}
        {status?.certificate && (
          <div className="card mb-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400">
            <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
              <Award className="w-7 h-7 text-yellow-600" />
              <span>Verification Certificate</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Verification Level</p>
                <p className="text-xl font-bold uppercase text-yellow-800">
                  {status.certificate.verification_level}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <p className="text-xl font-bold uppercase text-green-600">
                  {status.certificate.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Issued Date</p>
                <p className="text-lg font-semibold">
                  {new Date(status.certificate.issued_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Expires</p>
                <p className="text-lg font-semibold">
                  {new Date(status.certificate.expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white rounded-lg border border-yellow-300">
              <p className="text-xs text-gray-600 mb-2">Certificate Hash (Public Verification)</p>
              <p className="font-mono text-sm break-all text-gray-900 select-all">
                {status.certificate.hash}
              </p>
            </div>
          </div>
        )}

        {/* Challenge History */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Challenge History</h2>
          {completedChallenges.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No completed challenges yet. Take your first challenge to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {completedChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-semibold">
                      {challenge.type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span
                      className={`font-bold text-lg ${
                        challenge.score >= 80
                          ? 'text-green-600'
                          : challenge.score >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {challenge.score}%
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 mb-2">
                    {challenge.prompt}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    "{challenge.response.substring(0, 150)}
                    {challenge.response.length > 150 ? '...' : ''}"
                  </p>
                  <p className="text-xs text-gray-500">
                    Completed on{' '}
                    {new Date(challenge.completed_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
