/**
 * Knowledge Base GraphQL Schema
 *
 * Training materials, tutorials, documentation, and FAQs for beta agents.
 * Includes article management, search, view tracking, and progress monitoring.
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';

// === Enums ===

const ArticleCategoryEnum = builder.enumType('ArticleCategory', {
  values: [
    'getting_started',
    'features',
    'api_docs',
    'troubleshooting',
    'best_practices',
    'video_tutorials',
    'faqs',
    'release_notes',
  ] as const,
});

const ArticleDifficultyEnum = builder.enumType('ArticleDifficulty', {
  values: ['beginner', 'intermediate', 'advanced'] as const,
});

// === Input Types ===

const CreateArticleInput = builder.inputType('CreateArticleInput', {
  fields: (t) => ({
    title: t.string({ required: true }),
    slug: t.string({ required: true }),
    category: t.field({ type: ArticleCategoryEnum, required: true }),
    difficulty: t.field({ type: ArticleDifficultyEnum, required: true }),
    content: t.string({ required: true }), // Markdown
    excerpt: t.string({ required: true }),
    tags: t.stringList({ required: false }),
    videoUrl: t.string({ required: false }),
    estimatedReadTime: t.int({ required: false }), // minutes
    relatedArticleIds: t.stringList({ required: false }),
    published: t.boolean({ required: false }),
  }),
});

const UpdateArticleInput = builder.inputType('UpdateArticleInput', {
  fields: (t) => ({
    title: t.string({ required: false }),
    slug: t.string({ required: false }),
    category: t.field({ type: ArticleCategoryEnum, required: false }),
    difficulty: t.field({ type: ArticleDifficultyEnum, required: false }),
    content: t.string({ required: false }),
    excerpt: t.string({ required: false }),
    tags: t.stringList({ required: false }),
    videoUrl: t.string({ required: false }),
    estimatedReadTime: t.int({ required: false }),
    relatedArticleIds: t.stringList({ required: false }),
    published: t.boolean({ required: false }),
  }),
});

const ArticleFiltersInput = builder.inputType('ArticleFiltersInput', {
  fields: (t) => ({
    category: t.field({ type: ArticleCategoryEnum, required: false }),
    difficulty: t.field({ type: ArticleDifficultyEnum, required: false }),
    tags: t.stringList({ required: false }),
    published: t.boolean({ required: false }),
    search: t.string({ required: false }), // Search in title, excerpt, content
  }),
});

// === Object Types ===

const KnowledgeArticleType = builder.objectRef<{
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  content: string;
  excerpt: string;
  tags: string[];
  videoUrl: string | null;
  estimatedReadTime: number | null;
  published: boolean;
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  relatedArticleIds: string[];
}>('KnowledgeArticle');

KnowledgeArticleType.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    slug: t.exposeString('slug'),
    category: t.exposeString('category'),
    difficulty: t.exposeString('difficulty'),
    content: t.exposeString('content'),
    excerpt: t.exposeString('excerpt'),
    tags: t.exposeStringList('tags'),
    videoUrl: t.exposeString('videoUrl', { nullable: true }),
    estimatedReadTime: t.exposeInt('estimatedReadTime', { nullable: true }),
    published: t.exposeBoolean('published'),
    views: t.exposeInt('views'),
    helpfulCount: t.exposeInt('helpfulCount'),
    notHelpfulCount: t.exposeInt('notHelpfulCount'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    authorId: t.exposeString('authorId'),
    relatedArticleIds: t.exposeStringList('relatedArticleIds'),

    // Computed fields
    helpfulPercentage: t.float({
      resolve: (parent) => {
        const total = parent.helpfulCount + parent.notHelpfulCount;
        return total > 0 ? (parent.helpfulCount / total) * 100 : 0;
      },
    }),

    relatedArticles: t.field({
      type: [KnowledgeArticleType],
      resolve: async (parent) => {
        if (!parent.relatedArticleIds || parent.relatedArticleIds.length === 0) {
          return [];
        }
        return await prisma.knowledgeArticle.findMany({
          where: { id: { in: parent.relatedArticleIds } },
        });
      },
    }),
  }),
});

const ArticleProgressType = builder.objectRef<{
  id: string;
  userId: string;
  articleId: string;
  completed: boolean;
  progress: number;
  timeSpent: number;
  lastViewedAt: Date;
  completedAt: Date | null;
}>('ArticleProgress');

ArticleProgressType.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId'),
    articleId: t.exposeString('articleId'),
    completed: t.exposeBoolean('completed'),
    progress: t.exposeInt('progress'), // 0-100
    timeSpent: t.exposeInt('timeSpent'), // seconds
    lastViewedAt: t.expose('lastViewedAt', { type: 'DateTime' }),
    completedAt: t.expose('completedAt', { type: 'DateTime', nullable: true }),

    article: t.field({
      type: KnowledgeArticleType,
      resolve: async (parent) => {
        return await prisma.knowledgeArticle.findUniqueOrThrow({
          where: { id: parent.articleId },
        });
      },
    }),
  }),
});

const LearningPathType = builder.objectRef<{
  id: string;
  title: string;
  description: string;
  articleIds: string[];
  estimatedTotalTime: number;
  category: string;
  difficulty: string;
  published: boolean;
  createdAt: Date;
}>('LearningPath');

LearningPathType.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    description: t.exposeString('description'),
    articleIds: t.exposeStringList('articleIds'),
    estimatedTotalTime: t.exposeInt('estimatedTotalTime'), // minutes
    category: t.exposeString('category'),
    difficulty: t.exposeString('difficulty'),
    published: t.exposeBoolean('published'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),

    articles: t.field({
      type: [KnowledgeArticleType],
      resolve: async (parent) => {
        return await prisma.knowledgeArticle.findMany({
          where: { id: { in: parent.articleIds } },
        });
      },
    }),

    progress: t.field({
      type: 'Int',
      resolve: async (parent, _args, ctx) => {
        if (!ctx.user) return 0;

        const completed = await prisma.articleProgress.count({
          where: {
            userId: ctx.user.id,
            articleId: { in: parent.articleIds },
            completed: true,
          },
        });

        return parent.articleIds.length > 0
          ? Math.round((completed / parent.articleIds.length) * 100)
          : 0;
      },
    }),
  }),
});

const KnowledgeStatsType = builder.objectRef<{
  totalArticles: number;
  totalViews: number;
  totalCompletions: number;
  avgCompletionRate: number;
  popularArticles: Array<{ id: string; title: string; views: number }>;
  categoryBreakdown: Array<{ category: string; count: number }>;
}>('KnowledgeStats');

KnowledgeStatsType.implement({
  fields: (t) => ({
    totalArticles: t.exposeInt('totalArticles'),
    totalViews: t.exposeInt('totalViews'),
    totalCompletions: t.exposeInt('totalCompletions'),
    avgCompletionRate: t.exposeFloat('avgCompletionRate'),
    popularArticles: t.field({
      type: builder.objectRef<{ id: string; title: string; views: number }>('PopularArticle').implement({
        fields: (t) => ({
          id: t.exposeID('id'),
          title: t.exposeString('title'),
          views: t.exposeInt('views'),
        }),
      }),
      resolve: (parent) => parent.popularArticles,
    }),
    categoryBreakdown: t.field({
      type: builder.objectRef<{ category: string; count: number }>('CategoryBreakdown').implement({
        fields: (t) => ({
          category: t.exposeString('category'),
          count: t.exposeInt('count'),
        }),
      }),
      resolve: (parent) => parent.categoryBreakdown,
    }),
  }),
});

// === Queries ===

builder.queryFields((t) => ({
  knowledgeArticles: t.field({
    type: [KnowledgeArticleType],
    args: {
      filters: t.arg({ type: ArticleFiltersInput, required: false }),
    },
    resolve: async (_root, args) => {
      const where: any = {};

      if (args.filters) {
        if (args.filters.category) where.category = args.filters.category;
        if (args.filters.difficulty) where.difficulty = args.filters.difficulty;
        if (args.filters.published !== undefined) where.published = args.filters.published;

        if (args.filters.tags && args.filters.tags.length > 0) {
          where.tags = { hasSome: args.filters.tags };
        }

        if (args.filters.search) {
          where.OR = [
            { title: { contains: args.filters.search, mode: 'insensitive' } },
            { excerpt: { contains: args.filters.search, mode: 'insensitive' } },
            { content: { contains: args.filters.search, mode: 'insensitive' } },
          ];
        }
      }

      return await prisma.knowledgeArticle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),

  knowledgeArticle: t.field({
    type: KnowledgeArticleType,
    args: {
      id: t.arg.string({ required: false }),
      slug: t.arg.string({ required: false }),
    },
    resolve: async (_root, args) => {
      if (!args.id && !args.slug) {
        throw new Error('Either id or slug must be provided');
      }

      const where = args.id ? { id: args.id } : { slug: args.slug };

      return await prisma.knowledgeArticle.findUniqueOrThrow({ where });
    },
  }),

  myArticleProgress: t.field({
    type: [ArticleProgressType],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');

      return await prisma.articleProgress.findMany({
        where: { userId: ctx.user.id },
        orderBy: { lastViewedAt: 'desc' },
      });
    },
  }),

  learningPaths: t.field({
    type: [LearningPathType],
    args: {
      category: t.arg.string({ required: false }),
    },
    resolve: async (_root, args) => {
      const where: any = { published: true };
      if (args.category) where.category = args.category;

      return await prisma.learningPath.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),

  knowledgeStats: t.field({
    type: KnowledgeStatsType,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const totalArticles = await prisma.knowledgeArticle.count();

      const articles = await prisma.knowledgeArticle.findMany({
        select: { views: true },
      });
      const totalViews = articles.reduce((sum, a) => sum + a.views, 0);

      const totalCompletions = await prisma.articleProgress.count({
        where: { completed: true },
      });

      const allProgress = await prisma.articleProgress.findMany({
        select: { progress: true },
      });
      const avgCompletionRate = allProgress.length > 0
        ? allProgress.reduce((sum, p) => sum + p.progress, 0) / allProgress.length
        : 0;

      const popularArticles = await prisma.knowledgeArticle.findMany({
        orderBy: { views: 'desc' },
        take: 5,
        select: { id: true, title: true, views: true },
      });

      const allArticles = await prisma.knowledgeArticle.findMany({
        select: { category: true },
      });
      const categoryMap = new Map<string, number>();
      allArticles.forEach(a => {
        categoryMap.set(a.category, (categoryMap.get(a.category) || 0) + 1);
      });
      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        count,
      }));

      return {
        totalArticles,
        totalViews,
        totalCompletions,
        avgCompletionRate,
        popularArticles,
        categoryBreakdown,
      };
    },
  }),
}));

// === Mutations ===

builder.mutationFields((t) => ({
  createArticle: t.field({
    type: KnowledgeArticleType,
    args: {
      input: t.arg({ type: CreateArticleInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      return await prisma.knowledgeArticle.create({
        data: {
          title: args.input.title,
          slug: args.input.slug,
          category: args.input.category,
          difficulty: args.input.difficulty,
          content: args.input.content,
          excerpt: args.input.excerpt,
          tags: args.input.tags || [],
          videoUrl: args.input.videoUrl || null,
          estimatedReadTime: args.input.estimatedReadTime || null,
          relatedArticleIds: args.input.relatedArticleIds || [],
          published: args.input.published ?? false,
          authorId: ctx.user.id,
          views: 0,
          helpfulCount: 0,
          notHelpfulCount: 0,
        },
      });
    },
  }),

  updateArticle: t.field({
    type: KnowledgeArticleType,
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateArticleInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const data: any = {};
      if (args.input.title !== undefined) data.title = args.input.title;
      if (args.input.slug !== undefined) data.slug = args.input.slug;
      if (args.input.category !== undefined) data.category = args.input.category;
      if (args.input.difficulty !== undefined) data.difficulty = args.input.difficulty;
      if (args.input.content !== undefined) data.content = args.input.content;
      if (args.input.excerpt !== undefined) data.excerpt = args.input.excerpt;
      if (args.input.tags !== undefined) data.tags = args.input.tags;
      if (args.input.videoUrl !== undefined) data.videoUrl = args.input.videoUrl;
      if (args.input.estimatedReadTime !== undefined) data.estimatedReadTime = args.input.estimatedReadTime;
      if (args.input.relatedArticleIds !== undefined) data.relatedArticleIds = args.input.relatedArticleIds;
      if (args.input.published !== undefined) data.published = args.input.published;

      return await prisma.knowledgeArticle.update({
        where: { id: args.id },
        data,
      });
    },
  }),

  deleteArticle: t.field({
    type: 'Boolean',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      await prisma.knowledgeArticle.delete({
        where: { id: args.id },
      });

      return true;
    },
  }),

  trackArticleView: t.field({
    type: ArticleProgressType,
    args: {
      articleId: t.arg.string({ required: true }),
      progress: t.arg.int({ required: false }), // 0-100
      timeSpent: t.arg.int({ required: false }), // seconds
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');

      // Increment article view count
      await prisma.knowledgeArticle.update({
        where: { id: args.articleId },
        data: { views: { increment: 1 } },
      });

      // Upsert user progress
      const existing = await prisma.articleProgress.findFirst({
        where: {
          userId: ctx.user.id,
          articleId: args.articleId,
        },
      });

      const now = new Date();
      const progress = args.progress ?? (existing?.progress || 0);
      const completed = progress >= 100;

      if (existing) {
        return await prisma.articleProgress.update({
          where: { id: existing.id },
          data: {
            progress,
            completed,
            timeSpent: args.timeSpent !== undefined
              ? existing.timeSpent + args.timeSpent
              : existing.timeSpent,
            lastViewedAt: now,
            completedAt: completed && !existing.completedAt ? now : existing.completedAt,
          },
        });
      } else {
        return await prisma.articleProgress.create({
          data: {
            userId: ctx.user.id,
            articleId: args.articleId,
            progress,
            completed,
            timeSpent: args.timeSpent || 0,
            lastViewedAt: now,
            completedAt: completed ? now : null,
          },
        });
      }
    },
  }),

  markArticleHelpful: t.field({
    type: KnowledgeArticleType,
    args: {
      articleId: t.arg.string({ required: true }),
      helpful: t.arg.boolean({ required: true }), // true = helpful, false = not helpful
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Authentication required');

      return await prisma.knowledgeArticle.update({
        where: { id: args.articleId },
        data: args.helpful
          ? { helpfulCount: { increment: 1 } }
          : { notHelpfulCount: { increment: 1 } },
      });
    },
  }),
}));
