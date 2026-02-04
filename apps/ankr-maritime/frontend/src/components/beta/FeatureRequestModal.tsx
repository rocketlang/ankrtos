/**
 * Feature Request Modal
 *
 * Allows beta users to submit feature requests with voting.
 * Shows existing feature requests that can be upvoted.
 */

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Lightbulb, X, ThumbsUp, CheckCircle, Loader, AlertCircle, TrendingUp
} from 'lucide-react';

const FEATURE_REQUESTS_QUERY = gql`
  query FeatureRequests($filters: FeatureRequestFiltersInput) {
    featureRequests(filters: $filters) {
      id
      title
      description
      priority
      votes
      status
      createdAt
    }
  }
`;

const REQUEST_FEATURE = gql`
  mutation RequestFeature($input: FeatureRequestInput!) {
    requestFeature(input: $input) {
      id
      title
      description
      votes
      status
    }
  }
`;

const VOTE_FEATURE = gql`
  mutation VoteFeature($requestId: String!) {
    voteFeatureRequest(requestId: $requestId) {
      id
      votes
    }
  }
`;

const PRIORITY_LEVELS = [
  { value: 'HIGH', label: 'High Priority', description: 'Critical for my workflow', icon: '🔴' },
  { value: 'MEDIUM', label: 'Medium Priority', description: 'Would be very useful', icon: '🟡' },
  { value: 'LOW', label: 'Low Priority', description: 'Nice to have', icon: '🟢' },
];

interface FeatureRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureRequestModal({ isOpen, onClose }: FeatureRequestModalProps) {
  const [view, setView] = useState<'browse' | 'create' | 'success'>('browse');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [votedRequests, setVotedRequests] = useState<Set<string>>(new Set());

  const { data, loading: loadingRequests, refetch } = useQuery(FEATURE_REQUESTS_QUERY, {
    variables: { filters: { status: 'submitted' } },
    skip: !isOpen,
  });

  const [requestFeature, { loading: submitting, error: submitError }] = useMutation(REQUEST_FEATURE);
  const [voteFeature, { loading: voting }] = useMutation(VOTE_FEATURE);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please fill in title and description');
      return;
    }

    try {
      await requestFeature({
        variables: {
          input: {
            title,
            description,
            priority: priority || null,
          },
        },
      });

      setView('success');
      await refetch();

      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      console.error('Failed to submit feature request:', err);
    }
  };

  const handleVote = async (requestId: string) => {
    if (votedRequests.has(requestId)) {
      alert('You have already voted for this feature');
      return;
    }

    try {
      await voteFeature({ variables: { requestId } });
      setVotedRequests(prev => new Set(prev).add(requestId));
      await refetch();
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleClose = () => {
    setView('browse');
    setTitle('');
    setDescription('');
    setPriority('');
    onClose();
  };

  if (!isOpen) return null;

  const requests = data?.featureRequests || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-6 w-6" />
            <h2 className="text-xl font-bold">Feature Requests</h2>
          </div>
          <button
            onClick={handleClose}
            className="hover:bg-white/20 p-2 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setView('browse')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              view === 'browse'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Browse & Vote ({requests.length})
          </button>
          <button
            onClick={() => setView('create')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              view === 'create'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Submit New Request
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Browse View */}
          {view === 'browse' && (
            <div className="space-y-4">
              {loadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Feature Requests Yet</h3>
                  <p className="text-gray-600 mb-4">Be the first to suggest a new feature!</p>
                  <button
                    onClick={() => setView('create')}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Submit Feature Request
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <strong>Vote for features you want!</strong> The most popular requests
                        will be prioritized for development.
                      </div>
                    </div>
                  </div>

                  {requests.map((request: any) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Vote Button */}
                        <button
                          onClick={() => handleVote(request.id)}
                          disabled={voting || votedRequests.has(request.id)}
                          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                            votedRequests.has(request.id)
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 hover:bg-purple-50 text-gray-700 hover:text-purple-700'
                          } disabled:opacity-50`}
                        >
                          <ThumbsUp
                            className={`h-5 w-5 ${
                              votedRequests.has(request.id) ? 'fill-purple-700' : ''
                            }`}
                          />
                          <span className="text-sm font-bold">{request.votes}</span>
                        </button>

                        {/* Request Content */}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{request.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                          <div className="flex items-center gap-2 text-xs">
                            {request.priority && (
                              <span className={`px-2 py-1 rounded ${
                                request.priority === 'HIGH'
                                  ? 'bg-red-100 text-red-700'
                                  : request.priority === 'MEDIUM'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {request.priority}
                              </span>
                            )}
                            <span className="text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Create View */}
          {view === 'create' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feature Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Add support for..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the feature you'd like to see... What problem would it solve? How would it work?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={5}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be as detailed as possible to help us understand your needs
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Priority (Optional)
                </label>
                <div className="space-y-2">
                  {PRIORITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setPriority(level.value === priority ? '' : level.value)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        priority === level.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{level.icon}</span>
                        <div>
                          <div className="font-semibold text-gray-900">{level.label}</div>
                          <div className="text-xs text-gray-600">{level.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">
                    Failed to submit feature request. Please try again.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setView('browse')}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !title.trim() || !description.trim()}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Feature Request'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Success View */}
          {view === 'success' && (
            <div className="text-center py-12">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Feature Request Submitted!</h3>
              <p className="text-gray-600 mb-6">
                Thank you for your suggestion!
                <br />
                Other users can now vote on this feature.
              </p>
              <button
                onClick={() => setView('browse')}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                View All Requests
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
