import { Link } from 'react-router-dom'
import { Shield, CheckCircle, Award, Globe } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Prove You're <span className="text-yellow-300">Actually Human</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              In an AI-flooded world, human authenticity is the new currency.
              <br />
              Get verified. Stand out. Be trusted.
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/register" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-lg text-lg transition-colors">
                Get Verified Now
              </Link>
              <Link to="/login" className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors backdrop-blur-sm">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              The Problem is Real
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI can now write, code, create art, and even pass the Turing test.
              How do you prove your work is genuinely human?
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-4 rounded-full">
                  <Shield className="w-8 h-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">1. Take Human Challenges</h3>
              <p className="text-gray-600">
                Complete creative tasks designed to verify genuine human thought,
                emotion, and experience.
              </p>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-4 rounded-full">
                  <CheckCircle className="w-8 h-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">2. Get Verified</h3>
              <p className="text-gray-600">
                Our system scores your responses for authenticity. Pass 3+ challenges
                to earn your certificate.
              </p>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-4 rounded-full">
                  <Award className="w-8 h-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">3. Show Your Badge</h3>
              <p className="text-gray-600">
                Display your HumanProof badge on profiles, portfolios, and content.
                Let others verify you instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Who Needs This?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-xl font-bold mb-2">🎨 Creators & Artists</h3>
              <p className="text-gray-600">
                Prove your art, writing, and music are genuinely human-made in an
                era of AI-generated content.
              </p>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold mb-2">💼 Job Seekers</h3>
              <p className="text-gray-600">
                Stand out to employers by proving your portfolio and applications
                are authentically yours.
              </p>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold mb-2">📝 Writers & Journalists</h3>
              <p className="text-gray-600">
                Verify your articles and stories as human-written, building trust
                with readers.
              </p>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold mb-2">🌐 Online Communities</h3>
              <p className="text-gray-600">
                Fight bot spam and AI imposters. Build communities of real,
                verified humans.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Prove You're Human?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join the movement. Get verified in minutes.
          </p>
          <Link
            to="/register"
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-lg text-lg transition-colors inline-block"
          >
            Start Verification
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="flex items-center justify-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>
              © 2024 HumanProof. Built with Claude Code.
            </span>
          </p>
          <p className="mt-2 text-sm">
            Ironically created with AI to fight AI imposters 🤖❌
          </p>
        </div>
      </footer>
    </div>
  )
}
