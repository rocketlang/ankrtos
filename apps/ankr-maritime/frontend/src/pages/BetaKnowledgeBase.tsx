/**
 * Beta Knowledge Base - Training Materials & Tutorials
 *
 * Comprehensive training resources for beta agents including:
 * - Getting started guides
 * - Feature documentation
 * - API documentation
 * - Video tutorials
 * - FAQs
 * - Best practices
 */

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Book, Video, HelpCircle, FileText, Search, Clock, CheckCircle,
  TrendingUp, Star, ThumbsUp, ThumbsDown, Loader, PlayCircle,
  BookOpen, Lightbulb, Filter, ChevronRight
} from 'lucide-react';

// === GraphQL Queries ===

const KNOWLEDGE_ARTICLES_QUERY = gql`
  query KnowledgeArticles($filters: ArticleFiltersInput) {
    knowledgeArticles(filters: $filters) {
      id
      title
      slug
      category
      difficulty
      excerpt
      tags
      videoUrl
      estimatedReadTime
      views
      helpfulCount
      notHelpfulCount
      helpfulPercentage
      createdAt
    }
  }
`;

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
      helpfulPercentage
      createdAt
      relatedArticles {
        id
        title
        slug
        excerpt
        estimatedReadTime
      }
    }
  }
`;

const MY_PROGRESS_QUERY = gql`
  query MyArticleProgress {
    myArticleProgress {
      id
      articleId
      completed
      progress
      timeSpent
      lastViewedAt
      article {
        id
        title
        slug
        category
        estimatedReadTime
      }
    }
  }
`;

const LEARNING_PATHS_QUERY = gql`
  query LearningPaths($category: String) {
    learningPaths(category: $category) {
      id
      title
      description
      estimatedTotalTime
      category
      difficulty
      progress
      articles {
        id
        title
        estimatedReadTime
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

export default function BetaKnowledgeBase() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'articles' | 'paths' | 'progress'>('articles');

  const { data: articlesData, loading: articlesLoading } = useQuery(KNOWLEDGE_ARTICLES_QUERY, {
    variables: {
      filters: {
        category: selectedCategory,
        difficulty: selectedDifficulty,
        search: searchQuery || undefined,
        published: true,
      },
    },
  });

  const { data: progressData } = useQuery(MY_PROGRESS_QUERY);
  const { data: pathsData } = useQuery(LEARNING_PATHS_QUERY, {
    variables: { category: selectedCategory },
  });

  const [trackView] = useMutation(TRACK_VIEW_MUTATION);
  const [markHelpful] = useMutation(MARK_HELPFUL_MUTATION);

  const articles = articlesData?.knowledgeArticles || [];
  const myProgress = progressData?.myArticleProgress || [];
  const learningPaths = pathsData?.learningPaths || [];

  const categories = [
    { id: 'getting_started', label: 'Getting Started', icon: Book, color: 'blue' },
    { id: 'features', label: 'Features', icon: Lightbulb, color: 'purple' },
    { id: 'api_docs', label: 'API Docs', icon: FileText, color: 'green' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: HelpCircle, color: 'red' },
    { id: 'best_practices', label: 'Best Practices', icon: Star, color: 'yellow' },
    { id: 'video_tutorials', label: 'Video Tutorials', icon: Video, color: 'orange' },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle, color: 'indigo' },
    { id: 'release_notes', label: 'Release Notes', icon: TrendingUp, color: 'pink' },
  ];

  const difficulties = [
    { id: 'beginner', label: 'Beginner', color: 'green' },
    { id: 'intermediate', label: 'Intermediate', color: 'yellow' },
    { id: 'advanced', label: 'Advanced', color: 'red' },
  ];

  const handleArticleClick = (slug: string) => {
    setSelectedArticle(slug);
  };

  const handleMarkHelpful = async (articleId: string, helpful: boolean) => {
    try {
      await markHelpful({ variables: { articleId, helpful } });
    } catch (err) {
      console.error('Failed to mark article helpful:', err);
    }
  };

  // Calculate stats
  const totalArticles = articles.length;
  const completedArticles = myProgress.filter((p: any) => p.completed).length;
  const completionRate = totalArticles > 0 ? (completedArticles / totalArticles) * 100 : 0;
  const totalTimeSpent = myProgress.reduce((sum: number, p: any) => sum + p.timeSpent, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 Knowledge Base</h1>
          <p className="text-gray-600">Training materials, tutorials, and documentation</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={Book}
            label="Total Articles"
            value={totalArticles}
            color="blue"
          />
          <StatsCard
            icon={CheckCircle}
            label="Completed"
            value={`${completedArticles} (${completionRate.toFixed(0)}%)`}
            color="green"
          />
          <StatsCard
            icon={Clock}
            label="Time Spent"
            value={`${Math.floor(totalTimeSpent / 60)}m`}
            color="purple"
          />
          <StatsCard
            icon={TrendingUp}
            label="In Progress"
            value={myProgress.filter((p: any) => !p.completed && p.progress > 0).length}
            color="yellow"
          />
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <TabButton
            active={viewMode === 'articles'}
            onClick={() => setViewMode('articles')}
            icon={BookOpen}
            label="All Articles"
          />
          <TabButton
            active={viewMode === 'paths'}
            onClick={() => setViewMode('paths')}
            icon={TrendingUp}
            label="Learning Paths"
          />
          <TabButton
            active={viewMode === 'progress'}
            onClick={() => setViewMode('progress')}
            icon={CheckCircle}
            label="My Progress"
          />
        </div>

        {/* Articles View */}
        {viewMode === 'articles' && (
          <>
            {/* Category Filters */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter by Category
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    selectedCategory === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                      selectedCategory === cat.id
                        ? `bg-${cat.color}-600 text-white`
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <cat.icon className="h-4 w-4" />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filters */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Difficulty Level</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDifficulty(null)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm ${
                    selectedDifficulty === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  All
                </button>
                {difficulties.map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => setSelectedDifficulty(diff.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      selectedDifficulty === diff.id
                        ? `bg-${diff.color}-600 text-white`
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, tutorials, documentation..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Articles Grid */}
            {articlesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12">
                <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Articles Found</h3>
                <p className="text-gray-600">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article: any) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    progress={myProgress.find((p: any) => p.articleId === article.id)}
                    onClick={() => handleArticleClick(article.slug)}
                    onMarkHelpful={handleMarkHelpful}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Learning Paths View */}
        {viewMode === 'paths' && (
          <div className="space-y-6">
            {learningPaths.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Learning Paths Available</h3>
                <p className="text-gray-600">Check back soon for curated learning paths</p>
              </div>
            ) : (
              learningPaths.map((path: any) => (
                <LearningPathCard key={path.id} path={path} />
              ))
            )}
          </div>
        )}

        {/* Progress View */}
        {viewMode === 'progress' && (
          <div className="space-y-4">
            {myProgress.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress Yet</h3>
                <p className="text-gray-600">Start reading articles to track your progress</p>
              </div>
            ) : (
              myProgress.map((progress: any) => (
                <ProgressCard key={progress.id} progress={progress} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// === Helper Components ===

interface StatsCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}

function StatsCard({ icon: Icon, label, value, color }: StatsCardProps) {
  const colorClasses: any = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

function TabButton({ active, onClick, icon: Icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ArticleCard({ article, progress, onClick, onMarkHelpful }: any) {
  const isCompleted = progress?.completed;
  const progressPercent = progress?.progress || 0;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{article.excerpt}</p>
        </div>
        {article.videoUrl && (
          <PlayCircle className="h-6 w-6 text-blue-600 flex-shrink-0 ml-2" />
        )}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
          {article.category.replace('_', ' ')}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          article.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
          article.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {article.difficulty}
        </span>
        {article.estimatedReadTime && (
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="h-3 w-3" />
            {article.estimatedReadTime}m
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {progressPercent > 0 && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isCompleted ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            {article.helpfulPercentage.toFixed(0)}%
          </span>
          <span>{article.views} views</span>
        </div>
        {isCompleted && (
          <CheckCircle className="h-5 w-5 text-green-600" />
        )}
      </div>
    </div>
  );
}

function LearningPathCard({ path }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{path.title}</h3>
          <p className="text-gray-600 mb-4">{path.description}</p>
        </div>
        <div className={`text-3xl font-bold ${
          path.progress >= 100 ? 'text-green-600' :
          path.progress >= 50 ? 'text-yellow-600' :
          'text-blue-600'
        }`}>
          {path.progress}%
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
          {path.category}
        </span>
        <span className="flex items-center gap-1 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          {path.estimatedTotalTime}m total
        </span>
        <span className="text-sm text-gray-600">
          {path.articles.length} articles
        </span>
      </div>

      <div className="space-y-2">
        {path.articles.map((article: any, index: number) => (
          <div key={article.id} className="flex items-center gap-3 text-sm">
            <div className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
              {index + 1}
            </div>
            <span className="flex-1 text-gray-900">{article.title}</span>
            <span className="text-gray-600">{article.estimatedReadTime}m</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressCard({ progress }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {progress.article.title}
          </h3>
          <p className="text-sm text-gray-600">{progress.article.category}</p>
        </div>
        {progress.completed && (
          <CheckCircle className="h-6 w-6 text-green-600" />
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">{progress.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              progress.completed ? 'bg-green-600' : 'bg-blue-600'
            }`}
            style={{ width: `${progress.progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {Math.floor(progress.timeSpent / 60)}m spent
        </span>
        <span>Last viewed: {new Date(progress.lastViewedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
