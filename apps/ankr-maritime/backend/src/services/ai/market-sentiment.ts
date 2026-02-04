// market-sentiment.ts — Market Sentiment Analysis for Maritime Markets

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum SentimentScore {
  VERY_BULLISH = 'very_bullish',      // +2
  BULLISH = 'bullish',                // +1
  NEUTRAL = 'neutral',                 // 0
  BEARISH = 'bearish',                 // -1
  VERY_BEARISH = 'very_bearish',      // -2
}

interface MarketSentiment {
  overallSentiment: SentimentScore;
  score: number;                       // -100 to +100
  confidence: number;                  // 0-1
  factors: {
    newsHeadlines: number;             // Contribution from news analysis
    marketIndicators: number;          // From Baltic Index, etc.
    rateMovement: number;              // Recent rate changes
    volumeActivity: number;            // Trading activity
  };
  newsAnalysis: {
    totalArticles: number;
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    topKeywords: string[];
    recentHeadlines: Array<{
      title: string;
      sentiment: SentimentScore;
      date: Date;
      score: number;
    }>;
  };
  marketIndicators: {
    balticDryIndex?: {
      current: number;
      change: number;
      changePercent: number;
      trend: 'up' | 'down' | 'stable';
    };
    avgFreightRate?: {
      current: number;
      change: number;
      changePercent: number;
    };
  };
  insights: string[];
  recommendations: string[];
  timestamp: Date;
}

interface NewsArticle {
  id: string;
  title: string;
  content?: string;
  source?: string;
  publishedAt: Date;
  url?: string;
}

export class MarketSentimentAnalyzer {
  // Bullish keywords (positive market signals)
  private readonly BULLISH_KEYWORDS = [
    'strong demand',
    'rising rates',
    'tight supply',
    'firm market',
    'improving outlook',
    'robust growth',
    'increased activity',
    'positive trend',
    'bullish sentiment',
    'market strength',
    'tonnage shortage',
    'congestion',
    'capacity constraints',
    'rate surge',
    'firming',
    'uptick',
    'optimistic',
    'recovery',
    'rebound',
    'rally',
  ];

  // Bearish keywords (negative market signals)
  private readonly BEARISH_KEYWORDS = [
    'weak demand',
    'falling rates',
    'oversupply',
    'soft market',
    'deteriorating',
    'declining',
    'reduced activity',
    'negative trend',
    'bearish sentiment',
    'market weakness',
    'excess tonnage',
    'idle vessels',
    'overcapacity',
    'rate decline',
    'softening',
    'downturn',
    'pessimistic',
    'recession',
    'slump',
    'correction',
  ];

  /**
   * Analyze market sentiment from various sources
   */
  async analyzeMarketSentiment(
    params: {
      cargoType?: string;
      route?: string;
      timeframe?: 'daily' | 'weekly' | 'monthly';
      includeNews?: boolean;
    },
    organizationId: string
  ): Promise<MarketSentiment> {
    const { cargoType, route, timeframe = 'weekly', includeNews = true } = params;

    // 1. Analyze news headlines (if enabled)
    const newsAnalysis = includeNews
      ? await this.analyzeNewsHeadlines(cargoType, route, timeframe)
      : this.emptyNewsAnalysis();

    // 2. Analyze market indicators (Baltic Index, freight rates)
    const marketIndicators = await this.analyzeMarketIndicators(
      cargoType,
      route,
      timeframe,
      organizationId
    );

    // 3. Analyze rate movement from historical data
    const rateMovement = await this.analyzeRateMovement(cargoType, route, organizationId);

    // 4. Analyze trading volume/activity
    const volumeActivity = await this.analyzeTradingVolume(organizationId, timeframe);

    // 5. Calculate weighted sentiment score
    const factors = {
      newsHeadlines: newsAnalysis.score,
      marketIndicators: marketIndicators.score,
      rateMovement: rateMovement.score,
      volumeActivity: volumeActivity.score,
    };

    // Weighted average (news 30%, indicators 30%, rates 25%, volume 15%)
    const overallScore =
      factors.newsHeadlines * 0.3 +
      factors.marketIndicators * 0.3 +
      factors.rateMovement * 0.25 +
      factors.volumeActivity * 0.15;

    // 6. Determine overall sentiment
    const overallSentiment = this.scoreToSentiment(overallScore);

    // 7. Calculate confidence
    const confidence = this.calculateConfidence(
      newsAnalysis,
      marketIndicators,
      rateMovement
    );

    // 8. Generate insights
    const insights = this.generateInsights(
      overallScore,
      newsAnalysis,
      marketIndicators,
      rateMovement,
      volumeActivity
    );

    // 9. Generate recommendations
    const recommendations = this.generateRecommendations(overallSentiment, overallScore, insights);

    return {
      overallSentiment,
      score: Math.round(overallScore),
      confidence: Math.round(confidence * 100) / 100,
      factors,
      newsAnalysis: newsAnalysis.analysis,
      marketIndicators: marketIndicators.indicators,
      insights,
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Analyze news headlines for sentiment
   */
  private async analyzeNewsHeadlines(
    cargoType?: string,
    route?: string,
    timeframe: string = 'weekly'
  ): Promise<{ score: number; analysis: MarketSentiment['newsAnalysis'] }> {
    // In production, this would fetch from news API (e.g., NewsAPI, Baltic Exchange RSS)
    // For now, simulate with database stored news

    const daysBack = timeframe === 'daily' ? 1 : timeframe === 'weekly' ? 7 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Get news articles (simulated - in production, fetch from external API)
    const articles = await this.getNewsArticles(cargoType, route, cutoffDate);

    if (articles.length === 0) {
      return { score: 0, analysis: this.emptyNewsAnalysis() };
    }

    // Analyze each article
    const analyzed = articles.map((article) => ({
      ...article,
      sentiment: this.classifyHeadlineSentiment(article.title, article.content),
    }));

    // Count sentiments
    const bullishCount = analyzed.filter((a) =>
      [SentimentScore.BULLISH, SentimentScore.VERY_BULLISH].includes(a.sentiment.sentiment)
    ).length;
    const bearishCount = analyzed.filter((a) =>
      [SentimentScore.BEARISH, SentimentScore.VERY_BEARISH].includes(a.sentiment.sentiment)
    ).length;
    const neutralCount = analyzed.length - bullishCount - bearishCount;

    // Calculate average sentiment score
    const avgScore =
      analyzed.reduce((sum, a) => sum + a.sentiment.score, 0) / analyzed.length;

    // Extract top keywords
    const allKeywords = analyzed.flatMap((a) => a.sentiment.keywords || []);
    const keywordCounts = allKeywords.reduce(
      (acc, kw) => {
        acc[kw] = (acc[kw] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const topKeywords = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([kw]) => kw);

    // Recent headlines (top 5)
    const recentHeadlines = analyzed
      .slice(0, 5)
      .map((a) => ({
        title: a.title,
        sentiment: a.sentiment.sentiment,
        date: a.publishedAt,
        score: a.sentiment.score,
      }));

    return {
      score: avgScore,
      analysis: {
        totalArticles: articles.length,
        bullishCount,
        bearishCount,
        neutralCount,
        topKeywords,
        recentHeadlines,
      },
    };
  }

  /**
   * Classify headline sentiment using keyword matching
   */
  private classifyHeadlineSentiment(
    headline: string,
    content?: string
  ): { sentiment: SentimentScore; score: number; keywords?: string[] } {
    const text = (headline + ' ' + (content || '')).toLowerCase();

    let score = 0;
    const matchedKeywords: string[] = [];

    // Count bullish keywords
    for (const keyword of this.BULLISH_KEYWORDS) {
      if (text.includes(keyword)) {
        score += 10;
        matchedKeywords.push(keyword);
      }
    }

    // Count bearish keywords
    for (const keyword of this.BEARISH_KEYWORDS) {
      if (text.includes(keyword)) {
        score -= 10;
        matchedKeywords.push(keyword);
      }
    }

    // Normalize score to -100 to +100
    score = Math.max(-100, Math.min(100, score));

    return {
      sentiment: this.scoreToSentiment(score),
      score,
      keywords: matchedKeywords,
    };
  }

  /**
   * Analyze market indicators (Baltic Index, freight rates)
   */
  private async analyzeMarketIndicators(
    cargoType?: string,
    route?: string,
    timeframe: string = 'weekly',
    organizationId?: string
  ): Promise<{ score: number; indicators: MarketSentiment['marketIndicators'] }> {
    // In production, fetch Baltic Dry Index from external API
    // For now, simulate with historical data

    const daysBack = timeframe === 'daily' ? 1 : timeframe === 'weekly' ? 7 : 30;

    // Simulate Baltic Index data (in production, fetch from API)
    const balticIndex = {
      current: 1850,
      previous: 1720,
      change: 130,
      changePercent: 7.56,
      trend: 'up' as 'up' | 'down' | 'stable',
    };

    // Get average freight rate from database
    const avgRate = await this.getAverageFreightRate(cargoType, route, organizationId, daysBack);

    let indicatorScore = 0;

    // Baltic Index contribution
    if (balticIndex.changePercent > 5) indicatorScore += 30;
    else if (balticIndex.changePercent > 2) indicatorScore += 15;
    else if (balticIndex.changePercent < -5) indicatorScore -= 30;
    else if (balticIndex.changePercent < -2) indicatorScore -= 15;

    // Freight rate contribution
    if (avgRate && avgRate.changePercent > 5) indicatorScore += 20;
    else if (avgRate && avgRate.changePercent > 2) indicatorScore += 10;
    else if (avgRate && avgRate.changePercent < -5) indicatorScore -= 20;
    else if (avgRate && avgRate.changePercent < -2) indicatorScore -= 10;

    return {
      score: indicatorScore,
      indicators: {
        balticDryIndex: balticIndex,
        avgFreightRate: avgRate,
      },
    };
  }

  /**
   * Analyze rate movement from historical data
   */
  private async analyzeRateMovement(
    cargoType?: string,
    route?: string,
    organizationId?: string
  ): Promise<{ score: number; rateData: any }> {
    if (!organizationId) return { score: 0, rateData: null };

    // Get fixtures from last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const where: any = {
      organizationId,
      status: { in: ['approved', 'completed'] },
      freightRate: { not: null },
      laycanFrom: { gte: sixtyDaysAgo },
    };

    if (cargoType) {
      where.cargoType = { contains: cargoType, mode: 'insensitive' };
    }
    if (route) {
      where.route = { contains: route, mode: 'insensitive' };
    }

    const fixtures = await prisma.charter.findMany({
      where,
      select: { freightRate: true, laycanFrom: true },
      orderBy: { laycanFrom: 'asc' },
    });

    if (fixtures.length < 5) {
      return { score: 0, rateData: { insufficient: true } };
    }

    // Split into recent (last 14 days) vs previous
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentRates = fixtures
      .filter((f) => f.laycanFrom && f.laycanFrom >= fourteenDaysAgo)
      .map((f) => f.freightRate!);
    const previousRates = fixtures
      .filter((f) => f.laycanFrom && f.laycanFrom < fourteenDaysAgo)
      .map((f) => f.freightRate!);

    if (recentRates.length === 0 || previousRates.length === 0) {
      return { score: 0, rateData: { insufficient: true } };
    }

    const recentAvg = recentRates.reduce((a, b) => a + b, 0) / recentRates.length;
    const previousAvg = previousRates.reduce((a, b) => a + b, 0) / previousRates.length;
    const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

    // Score based on rate change
    let score = 0;
    if (changePercent > 10) score = 50;
    else if (changePercent > 5) score = 30;
    else if (changePercent > 2) score = 15;
    else if (changePercent < -10) score = -50;
    else if (changePercent < -5) score = -30;
    else if (changePercent < -2) score = -15;

    return {
      score,
      rateData: { recentAvg, previousAvg, changePercent, sampleSize: fixtures.length },
    };
  }

  /**
   * Analyze trading volume/activity
   */
  private async analyzeTradingVolume(
    organizationId: string,
    timeframe: string
  ): Promise<{ score: number; volumeData: any }> {
    const daysBack = timeframe === 'daily' ? 1 : timeframe === 'weekly' ? 7 : 30;
    const previousPeriod = daysBack * 2;

    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - daysBack);

    const previousCutoff = new Date();
    previousCutoff.setDate(previousCutoff.getDate() - previousPeriod);

    // Count fixtures in recent period
    const recentCount = await prisma.charter.count({
      where: {
        organizationId,
        status: { in: ['approved', 'completed'] },
        laycanFrom: { gte: recentCutoff },
      },
    });

    // Count fixtures in previous period
    const previousCount = await prisma.charter.count({
      where: {
        organizationId,
        status: { in: ['approved', 'completed'] },
        laycanFrom: { gte: previousCutoff, lt: recentCutoff },
      },
    });

    if (previousCount === 0) {
      return { score: 0, volumeData: { recentCount, previousCount } };
    }

    const changePercent = ((recentCount - previousCount) / previousCount) * 100;

    // Score based on volume change
    let score = 0;
    if (changePercent > 20) score = 20;
    else if (changePercent > 10) score = 10;
    else if (changePercent < -20) score = -20;
    else if (changePercent < -10) score = -10;

    return {
      score,
      volumeData: { recentCount, previousCount, changePercent },
    };
  }

  /**
   * Convert score to sentiment enum
   */
  private scoreToSentiment(score: number): SentimentScore {
    if (score >= 50) return SentimentScore.VERY_BULLISH;
    if (score >= 15) return SentimentScore.BULLISH;
    if (score <= -50) return SentimentScore.VERY_BEARISH;
    if (score <= -15) return SentimentScore.BEARISH;
    return SentimentScore.NEUTRAL;
  }

  /**
   * Calculate confidence in sentiment analysis
   */
  private calculateConfidence(
    newsAnalysis: any,
    marketIndicators: any,
    rateMovement: any
  ): number {
    let confidence = 0.5; // Base confidence

    // More news articles = higher confidence
    if (newsAnalysis.analysis.totalArticles >= 20) confidence += 0.2;
    else if (newsAnalysis.analysis.totalArticles >= 10) confidence += 0.1;
    else if (newsAnalysis.analysis.totalArticles >= 5) confidence += 0.05;

    // Market indicators available = higher confidence
    if (marketIndicators.indicators.balticDryIndex) confidence += 0.1;
    if (marketIndicators.indicators.avgFreightRate) confidence += 0.1;

    // More rate data = higher confidence
    if (rateMovement.rateData?.sampleSize >= 20) confidence += 0.1;
    else if (rateMovement.rateData?.sampleSize >= 10) confidence += 0.05;

    return Math.min(0.95, confidence);
  }

  /**
   * Generate insights from analysis
   */
  private generateInsights(
    overallScore: number,
    newsAnalysis: any,
    marketIndicators: any,
    rateMovement: any,
    volumeActivity: any
  ): string[] {
    const insights: string[] = [];

    // Overall sentiment insight
    if (overallScore > 30) {
      insights.push('Market showing strong bullish signals across multiple indicators');
    } else if (overallScore < -30) {
      insights.push('Market showing strong bearish signals across multiple indicators');
    } else {
      insights.push('Market sentiment is mixed with no clear directional bias');
    }

    // News sentiment
    if (newsAnalysis.analysis.totalArticles > 0) {
      const bullishPct =
        (newsAnalysis.analysis.bullishCount / newsAnalysis.analysis.totalArticles) * 100;
      if (bullishPct > 60) {
        insights.push(`${Math.round(bullishPct)}% of recent news articles are bullish`);
      } else if (bullishPct < 40) {
        insights.push(`Only ${Math.round(bullishPct)}% of recent news articles are bullish`);
      }
    }

    // Rate movement
    if (rateMovement.rateData?.changePercent) {
      const change = rateMovement.rateData.changePercent;
      if (Math.abs(change) > 5) {
        insights.push(
          `Freight rates ${change > 0 ? 'increased' : 'decreased'} ${Math.abs(change).toFixed(1)}% recently`
        );
      }
    }

    // Volume activity
    if (volumeActivity.volumeData?.changePercent) {
      const change = volumeActivity.volumeData.changePercent;
      if (Math.abs(change) > 15) {
        insights.push(
          `Trading activity ${change > 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(0)}% vs previous period`
        );
      }
    }

    // Baltic Index
    if (marketIndicators.indicators.balticDryIndex) {
      const bdi = marketIndicators.indicators.balticDryIndex;
      if (Math.abs(bdi.changePercent) > 5) {
        insights.push(
          `Baltic Dry Index ${bdi.trend === 'up' ? 'surged' : 'dropped'} ${Math.abs(bdi.changePercent).toFixed(1)}%`
        );
      }
    }

    return insights;
  }

  /**
   * Generate recommendations based on sentiment
   */
  private generateRecommendations(
    sentiment: SentimentScore,
    score: number,
    insights: string[]
  ): string[] {
    const recommendations: string[] = [];

    switch (sentiment) {
      case SentimentScore.VERY_BULLISH:
        recommendations.push('Consider fixing freight now before rates rise further');
        recommendations.push('Strong market - negotiate aggressively for better terms');
        recommendations.push('Expect continued upward pressure on rates');
        break;

      case SentimentScore.BULLISH:
        recommendations.push('Favorable time to fix freight at current levels');
        recommendations.push('Market trending upward - monitor closely for peak');
        break;

      case SentimentScore.NEUTRAL:
        recommendations.push('Market balanced - no urgent action needed');
        recommendations.push('Good time to lock in medium-term positions');
        break;

      case SentimentScore.BEARISH:
        recommendations.push('Consider delaying fixtures if possible - rates may soften');
        recommendations.push('Market trending downward - negotiate aggressively');
        break;

      case SentimentScore.VERY_BEARISH:
        recommendations.push('Delay fixtures if possible - expect further rate decline');
        recommendations.push('Weak market - push hard on negotiations');
        recommendations.push('Consider shorter-term commitments to preserve flexibility');
        break;
    }

    return recommendations;
  }

  /**
   * Get news articles (simulated - in production, fetch from API)
   */
  private async getNewsArticles(
    cargoType?: string,
    route?: string,
    cutoffDate?: Date
  ): Promise<NewsArticle[]> {
    // In production, fetch from NewsAPI, Baltic Exchange RSS, Lloyd's List, etc.
    // For now, return simulated data

    const simulatedNews: NewsArticle[] = [
      {
        id: 'news_1',
        title: 'Baltic Dry Index Surges on Strong Demand for Grain Shipments',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'news_2',
        title: 'Freight Rates Firm as Tonnage Shortage Persists in Atlantic',
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'news_3',
        title: 'Market Outlook: Improving Sentiment for Dry Bulk Sector',
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ];

    return simulatedNews;
  }

  /**
   * Get average freight rate from database
   */
  private async getAverageFreightRate(
    cargoType?: string,
    route?: string,
    organizationId?: string,
    daysBack: number = 7
  ): Promise<{ current: number; change: number; changePercent: number } | undefined> {
    if (!organizationId) return undefined;

    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - daysBack);

    const previousCutoff = new Date();
    previousCutoff.setDate(previousCutoff.getDate() - daysBack * 2);

    const where: any = {
      organizationId,
      status: { in: ['approved', 'completed'] },
      freightRate: { not: null },
    };

    if (cargoType) where.cargoType = { contains: cargoType, mode: 'insensitive' };
    if (route) where.route = { contains: route, mode: 'insensitive' };

    // Recent average
    const recentFixtures = await prisma.charter.findMany({
      where: { ...where, laycanFrom: { gte: recentCutoff } },
      select: { freightRate: true },
    });

    if (recentFixtures.length === 0) return undefined;

    const recentAvg =
      recentFixtures.reduce((sum, f) => sum + (f.freightRate || 0), 0) / recentFixtures.length;

    // Previous average
    const previousFixtures = await prisma.charter.findMany({
      where: { ...where, laycanFrom: { gte: previousCutoff, lt: recentCutoff } },
      select: { freightRate: true },
    });

    if (previousFixtures.length === 0) return undefined;

    const previousAvg =
      previousFixtures.reduce((sum, f) => sum + (f.freightRate || 0), 0) / previousFixtures.length;

    const change = recentAvg - previousAvg;
    const changePercent = (change / previousAvg) * 100;

    return {
      current: Math.round(recentAvg * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
    };
  }

  /**
   * Empty news analysis (when news disabled or unavailable)
   */
  private emptyNewsAnalysis(): MarketSentiment['newsAnalysis'] {
    return {
      totalArticles: 0,
      bullishCount: 0,
      bearishCount: 0,
      neutralCount: 0,
      topKeywords: [],
      recentHeadlines: [],
    };
  }
}

export const marketSentiment = new MarketSentimentAnalyzer();
