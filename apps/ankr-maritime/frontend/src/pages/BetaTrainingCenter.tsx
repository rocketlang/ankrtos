/**
 * Beta Training Center
 *
 * Knowledge base, tutorials, and training materials for beta agents.
 * Features article browsing, search, progress tracking, and learning paths.
 */

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  BookOpen, Video, FileText, HelpCircle, TrendingUp, CheckCircle,
  Search, Filter, Clock, Award, Play, ChevronRight, Star, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      published
      views
      helpfulCount
      notHelpfulCount
      createdAt
      helpfulPercentage
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
        difficulty
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
        difficulty
        estimatedReadTime
      }
    }
  }
`;

export default function BetaTrainingCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'browse' | 'paths' | 'progress'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: articlesData, loading: articlesLoading } = useQuery(KNOWLEDGE_ARTICLES_QUERY, {
    variables: {
      filters: {
        category: selectedCategory || undefined,
        difficulty: selectedDifficulty || undefined,
        search: searchQuery || undefined,
        published: true,
      },
    },
  });

  const { data: progressData, loading: progressLoading } = useQuery(MY_PROGRESS_QUERY);
  const { data: pathsData, loading: pathsLoading } = useQuery(LEARNING_PATHS_QUERY, {
    variables: { category: selectedCategory || undefined },
  });

  const articles = articlesData?.knowledgeArticles || [];
  const myProgress = progressData?.myArticleProgress || [];
  const learningPaths = pathsData?.learningPaths || [];

  // Calculate stats
  const totalArticles = articles.length;
  const completedArticles = myProgress.filter((p: any) => p.completed).length;
  const inProgressArticles = myProgress.filter((p: any) => !p.completed && p.progress > 0).length;
  const totalTimeSpent = myProgress.reduce((sum: number, p: any) => sum + p.timeSpent, 0);

  const categories = [
    { value: 'getting_started', label: 'Getting Started', icon: '🚀', color: 'blue' },
    { value: 'features', label: 'Features', icon: '⚡', color: 'purple' },
    { value: 'api_docs', label: 'API Documentation', icon: '📡', color: 'green' },
    { value: 'troubleshooting', label: 'Troubleshooting', icon: '🔧', color: 'red' },
    { value: 'best_practices', label: 'Best Practices', icon: '⭐', color: 'yellow' },
    { value: 'video_tutorials', label: 'Video Tutorials', icon: '🎥', color: 'pink' },
    { value: 'faqs', label: 'FAQs', icon: '❓', color: 'indigo' },
    { value: 'release_notes', label: 'Release Notes', icon: '📋', color: 'gray' },
  ];

  const difficulties = [
    { value: 'beginner', label: 'Beginner', color: 'green' },
    { value: 'intermediate', label: 'Intermediate', color: 'yellow' },
    { value: 'advanced', label: 'Advanced', color: 'red' },
  ];

  const getCategoryInfo = (value: string) => categories.find(c => c.value === value);
  const getDifficultyInfo = (value: string) => difficulties.find(d => d.value === value);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-blue-600" />
          Beta Training Center
        </h1>
        <p className="text-gray-600">Learn how to use Mari8X and maximize your productivity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={FileText}
          label="Articles Available"
          value={totalArticles}
          color="blue"
        />
        <StatsCard
          icon={CheckCircle}
          label="Completed"
          value={completedArticles}
          subtitle={`${inProgressArticles} in progress`}
          color="green"
        />
        <StatsCard
          icon={Clock}
          label="Time Invested"
          value={`${Math.round(totalTimeSpent / 60)}m`}
          color="purple"
        />
        <StatsCard
          icon={Award}
          label="Completion Rate"
          value={totalArticles > 0 ? `${Math.round((completedArticles / totalArticles) * 100)}%` : '0%'}
          color="yellow"
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="flex border-b border-gray-200">
          <TabButton
            active={activeTab === 'browse'}
            onClick={() => setActiveTab('browse')}
            icon={BookOpen}
            label="Browse Articles"
          />
          <TabButton
            active={activeTab === 'paths'}
            onClick={() => setActiveTab('paths')}
            icon={TrendingUp}
            label="Learning Paths"
          />
          <TabButton
            active={activeTab === 'progress'}
            onClick={() => setActiveTab('progress')}
            icon={Award}
            label="My Progress"
          />
        </div>

        {/* Browse Articles Tab */}
        {activeTab === 'browse' && (
          <div className="p-6">
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-4 flex-wrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Levels</option>
                  {difficulties.map(diff => (
                    <option key={diff.value} value={diff.value}>
                      {diff.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Articles Grid */}
            {articlesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article: any) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    progress={myProgress.find((p: any) => p.articleId === article.id)}
                    onClick={() => navigate(`/training/article/${article.slug}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Learning Paths Tab */}
        {activeTab === 'paths' && (
          <div className="p-6">
            {pathsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : learningPaths.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No learning paths available</h3>
                <p className="text-gray-600">Check back soon for curated learning paths</p>
              </div>
            ) : (
              <div className="space-y-6">
                {learningPaths.map((path: any) => (
                  <LearningPathCard key={path.id} path={path} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Progress Tab */}
        {activeTab === 'progress' && (
          <div className="p-6">
            {progressLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : myProgress.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No progress yet</h3>
                <p className="text-gray-600">Start reading articles to track your progress</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Browse Articles
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Completed Articles */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Completed ({completedArticles})
                  </h3>
                  <div className="space-y-3">
                    {myProgress
                      .filter((p: any) => p.completed)
                      .map((progress: any) => (
                        <ProgressCard key={progress.id} progress={progress} />
                      ))}
                  </div>
                </div>

                {/* In Progress Articles */}
                {inProgressArticles > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      In Progress ({inProgressArticles})
                    </h3>
                    <div className="space-y-3">
                      {myProgress
                        .filter((p: any) => !p.completed && p.progress > 0)
                        .map((progress: any) => (
                          <ProgressCard key={progress.id} progress={progress} />
                        ))}
                    </div>
                  </div>
                )}
              </div>
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
  subtitle?: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

function StatsCard({ icon: Icon, label, value, subtitle, color }: StatsCardProps) {
  const colorClasses = {
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
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
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
      className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
        active
          ? 'border-b-2 border-blue-600 text-blue-700 bg-blue-50'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function ArticleCard({ article, progress, onClick }: { article: any; progress?: any; onClick: () => void }) {
  const categoryInfo = {
    getting_started: { icon: '🚀', color: 'blue' },
    features: { icon: '⚡', color: 'purple' },
    api_docs: { icon: '📡', color: 'green' },
    troubleshooting: { icon: '🔧', color: 'red' },
    best_practices: { icon: '⭐', color: 'yellow' },
    video_tutorials: { icon: '🎥', color: 'pink' },
    faqs: { icon: '❓', color: 'indigo' },
    release_notes: { icon: '📋', color: 'gray' },
  }[article.category] || { icon: '📄', color: 'gray' };

  const difficultyColor = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  }[article.difficulty];

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{categoryInfo.icon}</span>
        {article.videoUrl && (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
            <Video className="h-3 w-3" />
            Video
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {article.title}
      </h3>

      {/* Excerpt */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
        <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyColor}`}>
          {article.difficulty}
        </span>
        {article.estimatedReadTime && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {article.estimatedReadTime}m
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="h-4 w-4" />
          {article.views} views
        </span>
      </div>

      {/* Progress */}
      {progress && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {progress.completed ? 'Completed' : `${progress.progress}% complete`}
            </span>
            {progress.completed && <CheckCircle className="h-5 w-5 text-green-600" />}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${progress.completed ? 'bg-green-600' : 'bg-blue-600'}`}
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

function LearningPathCard({ path }: { path: any }) {
  const difficultyColor = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  }[path.difficulty];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{path.title}</h3>
          <p className="text-gray-600 mb-4">{path.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColor}`}>
          {path.difficulty}
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          {path.articles.length} articles
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {path.estimatedTotalTime}m total
        </span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">{path.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${path.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-2">
        {path.articles.slice(0, 3).map((article: any, index: number) => (
          <div key={article.id} className="flex items-center gap-3 text-sm">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
              {index + 1}
            </span>
            <span className="text-gray-900">{article.title}</span>
            <span className="text-gray-500">({article.estimatedReadTime}m)</span>
          </div>
        ))}
        {path.articles.length > 3 && (
          <div className="text-sm text-gray-500 pl-9">
            + {path.articles.length - 3} more articles
          </div>
        )}
      </div>

      {/* Action Button */}
      <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
        <Play className="h-4 w-4" />
        Start Learning Path
      </button>
    </div>
  );
}

function ProgressCard({ progress }: { progress: any }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/training/article/${progress.article.slug}`)}
      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">{progress.article.title}</h4>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="capitalize">{progress.article.difficulty}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {Math.round(progress.timeSpent / 60)}m spent
            </span>
            {progress.article.estimatedReadTime && (
              <span>Est: {progress.article.estimatedReadTime}m</span>
            )}
          </div>
        </div>
        {progress.completed ? (
          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
        ) : (
          <span className="text-sm font-medium text-blue-600">{progress.progress}%</span>
        )}
      </div>

      {!progress.completed && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
