/**
 * Beta Feedback Widget
 *
 * Floating feedback button accessible on all pages.
 * Allows beta users to quickly submit feedback, report bugs, or request features.
 */

import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import {
  MessageCircle, X, Star, Send, AlertCircle, CheckCircle, Lightbulb,
  Camera, Loader
} from 'lucide-react';
import { BugReportModal } from './BugReportModal';
import { FeatureRequestModal } from './FeatureRequestModal';

const SUBMIT_FEEDBACK = gql`
  mutation SubmitFeedback($input: BetaFeedbackInput!) {
    submitBetaFeedback(input: $input) {
      id
      rating
      category
      feedback
      createdAt
    }
  }
`;

const CATEGORIES = [
  { value: 'UI', label: 'User Interface', icon: '🎨' },
  { value: 'Performance', label: 'Performance', icon: '⚡' },
  { value: 'Features', label: 'Features', icon: '✨' },
  { value: 'Documentation', label: 'Documentation', icon: '📚' },
  { value: 'Support', label: 'Support', icon: '💬' },
];

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('');
  const [feedback, setFeedback] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [showBugModal, setShowBugModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);

  const [submitFeedback, { loading, error }] = useMutation(SUBMIT_FEEDBACK);

  const handleSubmit = async () => {
    if (!rating || !category || !feedback.trim()) {
      alert('Please provide rating, category, and feedback');
      return;
    }

    try {
      await submitFeedback({
        variables: {
          input: {
            rating,
            category,
            feedback,
            screenshot: screenshot || null,
            url: window.location.href,
            browser: navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown',
            userAgent: navigator.userAgent,
          },
        },
      });

      // Show success and reset form
      setShowSuccess(true);
      setRating(0);
      setCategory('');
      setFeedback('');
      setScreenshot('');

      setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const captureScreenshot = async () => {
    // Placeholder - would use html2canvas or similar library
    alert('Screenshot capture feature coming soon! For now, you can paste a screenshot URL.');
    const url = prompt('Enter screenshot URL (optional):');
    if (url) {
      setScreenshot(url);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50 group"
          title="Send Feedback"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Send Feedback
          </span>
        </button>
      )}

      {/* Feedback Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-xl shadow-2xl z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Beta Feedback</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Success State */}
          {showSuccess ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Thank You!</h4>
              <p className="text-gray-600 text-sm">
                Your feedback has been submitted successfully.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsOpen(false); setShowBugModal(true); }}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <AlertCircle className="h-4 w-4" />
                  Report Bug
                </button>
                <button
                  onClick={() => { setIsOpen(false); setShowFeatureModal(true); }}
                  className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Lightbulb className="h-4 w-4" />
                  Request Feature
                </button>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How would you rate your experience?
                </label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-125"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-gray-600 mt-2">
                    {rating === 5 && '⭐ Excellent!'}
                    {rating === 4 && '👍 Great!'}
                    {rating === 3 && '😊 Good'}
                    {rating === 2 && '😕 Could be better'}
                    {rating === 1 && '😞 Needs improvement'}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`p-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        category === cat.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="mr-1">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what you think... What's working well? What could be improved?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {feedback.length} / 500 characters
                </p>
              </div>

              {/* Screenshot */}
              <div>
                <button
                  onClick={captureScreenshot}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Camera className="h-4 w-4" />
                  {screenshot ? 'Screenshot added ✓' : 'Add screenshot (optional)'}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">
                    Failed to submit feedback. Please try again.
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || !rating || !category || !feedback.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Feedback
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bug Report Modal */}
      <BugReportModal isOpen={showBugModal} onClose={() => setShowBugModal(false)} />

      {/* Feature Request Modal */}
      <FeatureRequestModal isOpen={showFeatureModal} onClose={() => setShowFeatureModal(false)} />
    </>
  );
}
