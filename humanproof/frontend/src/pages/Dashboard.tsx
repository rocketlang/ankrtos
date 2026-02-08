import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { verificationAPI } from '../services/api'
import { CheckCircle, Award, Clock, ArrowRight } from 'lucide-react'

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

export default function Dashboard() {
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await verificationAPI.getStatus()
      setStatus(response.data)
    } catch (error) {
      console.error('Failed to fetch status:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestCertificate = async () => {
    setRequesting(true)
    setMessage('')

    try {
      await verificationAPI.requestCertificate()
      setMessage('✅ Certificate issued successfully!')
      fetchStatus() // Refresh status
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to request certificate')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  const challengesNeeded = Math.max(0, 3 - (status?.completedChallenges || 0))
  const canRequestCert = (status?.completedChallenges || 0) >= 3

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Verification Status Card */}
        <div className="card mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Verification Status</h2>
              {status?.verified ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  <span className="text-xl font-semibold">Verified Human ✨</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-yellow-600">
                  <Clock className="w-6 h-6" />
                  <span className="text-xl font-semibold">Verification Pending</span>
                </div>
              )}
            </div>
            {status?.verified && (
              <Award className="w-16 h-16 text-yellow-500" />
            )}
          </div>
        </div>

        {/* Progress Card */}
        <div className="card mb-6">
          <h3 className="text-xl font-bold mb-4">Your Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Challenges Completed</span>
                <span className="font-bold text-primary-600">
                  {status?.completedChallenges || 0} / 3
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      ((status?.completedChallenges || 0) / 3) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {!status?.verified && (
              <p className="text-gray-600">
                {challengesNeeded > 0
                  ? `Complete ${challengesNeeded} more challenge${
                      challengesNeeded > 1 ? 's' : ''
                    } to request your certificate.`
                  : 'You can now request your verification certificate!'}
              </p>
            )}
          </div>
        </div>

        {/* Certificate Card */}
        {status?.certificate ? (
          <div className="card mb-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Award className="w-6 h-6 text-yellow-600" />
              <span>Your Certificate</span>
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Level:</span>
                <span className="font-semibold uppercase">
                  {status.certificate.verification_level}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Issued:</span>
                <span className="font-semibold">
                  {new Date(status.certificate.issued_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Expires:</span>
                <span className="font-semibold">
                  {new Date(status.certificate.expires_at).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-4 p-3 bg-white rounded border border-yellow-300">
                <p className="text-xs text-gray-600 mb-1">Certificate Hash:</p>
                <p className="font-mono text-xs break-all text-gray-900">
                  {status.certificate.hash}
                </p>
              </div>
            </div>
          </div>
        ) : canRequestCert ? (
          <div className="card mb-6">
            <h3 className="text-xl font-bold mb-4">Request Certificate</h3>
            <p className="text-gray-600 mb-4">
              Congratulations! You've completed enough challenges to earn your
              verification certificate.
            </p>
            {message && (
              <div
                className={`mb-4 px-4 py-3 rounded ${
                  message.startsWith('✅')
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {message}
              </div>
            )}
            <button
              onClick={requestCertificate}
              disabled={requesting}
              className="btn-primary disabled:opacity-50"
            >
              {requesting ? 'Requesting...' : 'Request Certificate'}
            </button>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            to="/challenge"
            className="card hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Take Challenge</h3>
                <p className="text-gray-600">
                  Complete a new verification challenge
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-primary-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/profile"
            className="card hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">View Profile</h3>
                <p className="text-gray-600">See your public verification badge</p>
              </div>
              <ArrowRight className="w-6 h-6 text-primary-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
