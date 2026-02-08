import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { challengeAPI } from '../services/api'
import { Sparkles, Send, AlertCircle } from 'lucide-react'

interface Challenge {
  id: string
  type: string
  prompt: string
  status: string
}

export default function Challenge() {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    score: number
    passed: boolean
    message: string
  } | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    fetchChallenge()
  }, [])

  const fetchChallenge = async () => {
    try {
      const response = await challengeAPI.getNext()
      setChallenge(response.data)
    } catch (error) {
      console.error('Failed to fetch challenge:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challenge || response.trim().length < 10) return

    setSubmitting(true)
    setResult(null)

    try {
      const res = await challengeAPI.submit(challenge.id, response)
      setResult(res.data)

      // If passed, redirect to dashboard after 3 seconds
      if (res.data.passed) {
        setTimeout(() => {
          navigate('/dashboard')
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to submit challenge:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleTryAgain = () => {
    setResponse('')
    setResult(null)
    fetchChallenge()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading challenge...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Sparkles className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Human Verification Challenge
          </h1>
          <p className="text-gray-600">
            Answer thoughtfully and authentically. AI can't fake genuine human experience.
          </p>
        </div>

        {challenge && (
          <div className="card mb-6">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                {challenge.type.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {challenge.prompt}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="input-field min-h-[200px] resize-y"
                  placeholder="Write your response here... Be genuine, be human."
                  disabled={submitting || !!result}
                  required
                />
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>Minimum 10 characters</span>
                  <span>{response.length} characters</span>
                </div>
              </div>

              {!result && (
                <button
                  type="submit"
                  disabled={submitting || response.trim().length < 10}
                  className="w-full btn-primary disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>{submitting ? 'Submitting...' : 'Submit Response'}</span>
                </button>
              )}
            </form>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div
            className={`card ${
              result.passed
                ? 'bg-green-50 border-2 border-green-400'
                : 'bg-yellow-50 border-2 border-yellow-400'
            }`}
          >
            <div className="text-center">
              {result.passed ? (
                <>
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold text-green-900 mb-2">
                    Challenge Passed!
                  </h3>
                  <p className="text-green-700 mb-4">{result.message}</p>
                  <p className="text-lg font-semibold text-green-900">
                    Score: {result.score}/100
                  </p>
                  <p className="text-sm text-green-600 mt-4">
                    Redirecting to dashboard...
                  </p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🤔</div>
                  <h3 className="text-2xl font-bold text-yellow-900 mb-2">
                    Try Again
                  </h3>
                  <p className="text-yellow-700 mb-4">{result.message}</p>
                  <p className="text-lg font-semibold text-yellow-900 mb-6">
                    Score: {result.score}/100 (Need 60+)
                  </p>
                  <button
                    onClick={handleTryAgain}
                    className="btn-primary"
                  >
                    Try Another Challenge
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Tips for Success</h3>
              <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
                <li>Be authentic - share real thoughts and experiences</li>
                <li>Use personal pronouns (I, my, me) when appropriate</li>
                <li>Include specific details that AI wouldn't know</li>
                <li>Don't overthink it - genuine responses work best</li>
                <li>Avoid generic or textbook-style answers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
