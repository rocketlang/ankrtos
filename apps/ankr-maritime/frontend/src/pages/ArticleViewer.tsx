/**
 * Article Viewer
 *
 * Displays knowledge base articles with markdown rendering,
 * progress tracking, helpful voting, and related articles.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  ArrowLeft, Clock, Tag, ThumbsUp, ThumbsDown, Video, CheckCircle,
  Share2, Bookmark, ChevronRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// === GraphQL Queries ===

const ARTICLE_QUERY = gql`
  query KnowledgeArticle($slug: String!) {
    knowledgeArticle(slug: $slug) {
      id
      title
      slug
      category
      difficulty
      content
      excerpt
      tags
      videoUrl
      estimatedReadTime
      views
      helpfulCount
      notHelpfulCount
      createdAt
      updatedAt
      helpfulPercentage
      relatedArticles {
        id
        title
        slug
        category
        difficulty
        estimatedReadTime
        excerpt
      }
    }
  }
`;

const TRACK_VIEW_MUTATION = gql`
  mutation TrackArticleView($articleId: String!, $progress: Int, $timeSpent: Int) {
    trackArticleView(articleId: $articleId, progress: $progress, timeSpent: $timeSpent) {
      id
      progress
      completed
      timeSpent
    }
  }
`;

const MARK_HELPFUL_MUTATION = gql`
  mutation MarkArticleHelpful($articleId: String!, $helpful: Boolean!) {
    markArticleHelpful(articleId: $articleId, helpful: $helpful) {
      id
      helpfulCount
      notHelpfulCount
    }
  }
`;

export default function ArticleViewer() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [startTime] = useState(Date.now());
  const [voted, setVoted] = useState(false);

  const { data, loading, error } = useQuery(ARTICLE_QUERY, {
    variables: { slug },
    skip: !slug,
  });

  const [trackView] = useMutation(TRACK_VIEW_MUTATION);
  const [markHelpful] = useMutation(MARK_HELPFUL_MUTATION);

  const article = data?.knowledgeArticle;

  // Track view on mount
  useEffect(() => {
    if (article) {
      trackView({
        variables: {
          articleId: article.id,
          progress: 0,
          timeSpent: 0,
        },
      });
    }
  }, [article, trackView]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
      setProgress(Math.min(Math.round(scrollPercent), 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track progress and time spent
  useEffect(() => {
    if (!article) return;

    const interval = setInterval(() => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      trackView({
        variables: {
          articleId: article.id,
          progress,
          timeSpent,
        },
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [article, progress, startTime, trackView]);

  const handleVote = async (helpful: boolean) => {
    if (voted || !article) return;

    try {
      await markHelpful({
        variables: {
          articleId: article.id,
          helpful,
        },
      });
      setVoted(true);
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h2>
          <p className="text-gray-600 mb-6">The article you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/training')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Training Center
          </button>
        </div>
      </div>
    );
  }

  const difficultyColor = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  }[article.difficulty];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-gray-200">
          <div
            className="h-1 bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-1 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/training')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Training
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{progress}% read</span>
              {progress >= 100 && (
                <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                  <CheckCircle className="h-5 w-5" />
                  Completed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColor}`}>
              {article.difficulty}
            </span>
            <span className="text-sm text-gray-500 capitalize">{article.category.replace('_', ' ')}</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            {article.estimatedReadTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {article.estimatedReadTime} min read
              </span>
            )}
            <span>{article.views} views</span>
            <span>
              Updated {new Date(article.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Video (if available) */}
        {article.videoUrl && (
          <div className="mb-8 bg-black rounded-lg overflow-hidden">
            <div className="aspect-video">
              <iframe
                src={article.videoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* Article Content (Markdown) */}
        <div className="prose prose-lg max-w-none mb-12">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Helpful Voting */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Was this article helpful?</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleVote(true)}
              disabled={voted}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                voted
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              <ThumbsUp className="h-5 w-5" />
              Yes ({article.helpfulCount})
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={voted}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                voted
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              <ThumbsDown className="h-5 w-5" />
              No ({article.notHelpfulCount})
            </button>
          </div>
          {voted && (
            <p className="mt-4 text-sm text-gray-600">Thank you for your feedback!</p>
          )}
          {article.helpfulCount + article.notHelpfulCount > 0 && (
            <p className="mt-4 text-sm text-gray-600">
              {article.helpfulPercentage.toFixed(0)}% of readers found this helpful
            </p>
          )}
        </div>

        {/* Related Articles */}
        {article.relatedArticles && article.relatedArticles.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {article.relatedArticles.map((related: any) => (
                <RelatedArticleCard key={related.id} article={related} />
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">What's Next?</h3>
          <p className="text-blue-700 mb-4">
            Continue your learning journey by exploring more articles or starting a learning path.
          </p>
          <button
            onClick={() => navigate('/training')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Training Center
          </button>
        </div>
      </div>
    </div>
  );
}

// === Helper Components ===

function RelatedArticleCard({ article }: { article: any }) {
  const navigate = useNavigate();

  const difficultyColor = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  }[article.difficulty];

  return (
    <div
      onClick={() => navigate(`/training/article/${article.slug}`)}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 line-clamp-2">{article.title}</h4>
        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
      </div>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{article.excerpt}</p>
      <div className="flex items-center gap-3 text-sm">
        <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyColor}`}>
          {article.difficulty}
        </span>
        {article.estimatedReadTime && (
          <span className="flex items-center gap-1 text-gray-500">
            <Clock className="h-4 w-4" />
            {article.estimatedReadTime}m
          </span>
        )}
      </div>
    </div>
  );
}
