/**
 * AIS Fun Facts Showcase Component
 *
 * Live-updating fun facts from 56M+ AIS positions
 * Perfect for landing page to demonstrate data capabilities
 */

import { useQuery } from '@apollo/client';
import { gql } from '../__generated__/gql';
import { useEffect, useState } from 'react';

const AIS_FUN_FACTS_QUERY = gql(`
  query AISFunFactsShowcase {
    aisFunFacts {
      dataScale {
        totalPositions
        uniqueVessels
        avgPositionsPerShip
        trackingCapacity
      }
      timeCoverage {
        earliestDate
        latestDate
        durationDays
        durationHours
        positionsPerHour
        positionsPerMinute
      }
      topSpeedRecords {
        vesselName
        vesselType
        maxSpeed
        maxSpeedKmh
      }
      mostActiveShips {
        vesselName
        vesselType
        totalPositions
        positionsPerDay
        updateFrequency
      }
      geoCoverage {
        latitudeSpan
        longitudeSpan
        coveragePercent
        description
      }
      last7DaysTrend {
        date
        count
      }
      mari8xosrmIntelligence {
        routesLearned
        avgDistanceFactor
        compressionRatio
        intelligenceExtracted
        insight
      }
      nearestToNorthPole {
        vesselName
        vesselType
        latitude
        longitude
        distanceNm
        distanceKm
      }
      nearestToSouthPole {
        vesselName
        vesselType
        latitude
        longitude
        distanceNm
        distanceKm
      }
      realTimeStats {
        shipsMovingNow
        shipsAtAnchor
        shipsOnEquator
        shipsAtSuez
        shipsAtCapeOfGoodHope
        coverageSqMiles
        coverageSqKm
      }
      lastUpdated
    }
  }
`);

export default function AISFunFacts() {
  const [activeFactIndex, setActiveFactIndex] = useState(0);
  const [animatedCount, setAnimatedCount] = useState(0);

  const { data, loading, error } = useQuery(AIS_FUN_FACTS_QUERY, {
    pollInterval: 60000, // Update every minute to show live data
    fetchPolicy: 'cache-and-network', // Show cached data while fetching - prevents blank page!
    errorPolicy: 'all', // Return partial data on error
    notifyOnNetworkStatusChange: false, // Don't show loading on refetch
  });

  const facts = data?.aisFunFacts;

  // Animate the total positions count
  useEffect(() => {
    if (facts?.dataScale?.totalPositions) {
      const target = facts.dataScale.totalPositions;
      const current = animatedCount;
      const diff = target - current;
      const steps = 50;
      const increment = diff / steps;

      let step = 0;
      const timer = setInterval(() => {
        step++;
        setAnimatedCount((prev) => Math.round(prev + increment));
        if (step >= steps) {
          setAnimatedCount(target);
          clearInterval(timer);
        }
      }, 20);

      return () => clearInterval(timer);
    }
  }, [facts?.dataScale?.totalPositions]);

  // Auto-rotate through fun facts every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFactIndex((prev) => (prev + 1) % 10);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-8">
        <div className="text-center text-blue-300">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <div>Loading fun facts from 56M+ AIS positions...</div>
        </div>
      </div>
    );
  }

  if (error || !facts) {
    // Fallback with static data instead of silent fail
    return (
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-8">
        <h3 className="text-3xl font-bold text-white flex items-center gap-3 mb-6">
          <span className="text-4xl">📊</span>
          AIS Data at Scale
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-400 mb-2">56.2M+</div>
            <div className="text-sm text-blue-300">AIS Positions Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">41.9K+</div>
            <div className="text-sm text-blue-300">Unique Vessels</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">1,340+</div>
            <div className="text-sm text-blue-300">Positions/Vessel Average</div>
          </div>
        </div>
        <div className="mt-6 text-center text-sm text-blue-400">
          Live data powers route optimization, vessel tracking, and predictive analytics
        </div>
      </div>
    );
  }

  const funFactsData = [
    {
      title: '📊 The Data Scale',
      emoji: '📊',
      metrics: [
        { label: 'Total AIS Positions', value: animatedCount.toLocaleString(), highlight: true },
        { label: 'Unique Vessels Tracked', value: facts.dataScale.uniqueVessels.toLocaleString(), highlight: true },
        { label: 'Avg Positions per Ship', value: facts.dataScale.avgPositionsPerShip.toLocaleString() },
      ],
      insight: facts.dataScale.trackingCapacity,
    },
    {
      title: '⚡ Real-Time Tracking',
      emoji: '⚡',
      metrics: [
        { label: 'Positions per Hour', value: facts.timeCoverage.positionsPerHour.toLocaleString(), highlight: true },
        { label: 'Updates per Minute', value: facts.timeCoverage.positionsPerMinute.toLocaleString(), highlight: true },
        { label: 'Days of Coverage', value: facts.timeCoverage.durationDays.toString() },
      ],
      insight: `We track ${facts.timeCoverage.positionsPerMinute.toLocaleString()} ship movements every minute!`,
    },
    {
      title: '🚢 Speed Demons',
      emoji: '🚢',
      metrics: facts.topSpeedRecords.slice(0, 3).map((record, i) => ({
        label: `#${i + 1} ${record.vesselName}`,
        value: `${record.maxSpeed.toFixed(1)} kn`,
        subtitle: `${record.maxSpeedKmh.toFixed(0)} km/h`,
      })),
      insight: `Top speed: ${facts.topSpeedRecords[0]?.maxSpeed.toFixed(0)} knots - that's highway speed on water!`,
    },
    {
      title: '🌍 Global Coverage',
      emoji: '🌍',
      metrics: [
        { label: 'Earth Coverage', value: `${facts.geoCoverage.coveragePercent.toFixed(0)}%`, highlight: true },
        { label: 'Latitude Span', value: `${facts.geoCoverage.latitudeSpan.toFixed(0)}°` },
        { label: 'Longitude Span', value: `${facts.geoCoverage.longitudeSpan.toFixed(0)}°` },
      ],
      insight: facts.geoCoverage.description,
    },
    {
      title: '📡 Marathon Sailors',
      emoji: '📡',
      metrics: facts.mostActiveShips.slice(0, 3).map((ship, i) => ({
        label: `#${i + 1} ${ship.vesselName}`,
        value: ship.totalPositions.toLocaleString(),
        subtitle: ship.updateFrequency,
      })),
      insight: 'Most active ships report their position every 30-60 seconds - true real-time!',
    },
    {
      title: '🧠 Mari8XOSRM Intelligence',
      emoji: '🧠',
      metrics: [
        { label: 'Routes Learned', value: facts.mari8xosrmIntelligence.routesLearned.toString(), highlight: true },
        { label: 'Avg Distance Factor', value: `${facts.mari8xosrmIntelligence.avgDistanceFactor.toFixed(2)}x` },
        { label: 'Compression Ratio', value: `${facts.mari8xosrmIntelligence.compressionRatio.toLocaleString()}:1`, highlight: true },
      ],
      insight: facts.mari8xosrmIntelligence.insight,
    },
    {
      title: '🧊 Nearest to North Pole',
      emoji: '🧊',
      metrics: facts.nearestToNorthPole ? [
        { label: 'Ship Name', value: facts.nearestToNorthPole.vesselName, highlight: true },
        { label: 'Distance', value: `${facts.nearestToNorthPole.distanceNm.toFixed(0)} nm`, subtitle: `${facts.nearestToNorthPole.distanceKm.toFixed(0)} km` },
        { label: 'Position', value: `${facts.nearestToNorthPole.latitude.toFixed(2)}°N` },
      ] : [
        { label: 'Status', value: 'No data', highlight: true },
      ],
      insight: facts.nearestToNorthPole
        ? `${facts.nearestToNorthPole.vesselName} is ${facts.nearestToNorthPole.distanceNm.toFixed(0)}nm from the North Pole!`
        : 'Tracking ships near polar regions...',
    },
    {
      title: '🐧 Nearest to South Pole',
      emoji: '🐧',
      metrics: facts.nearestToSouthPole ? [
        { label: 'Ship Name', value: facts.nearestToSouthPole.vesselName, highlight: true },
        { label: 'Distance', value: `${facts.nearestToSouthPole.distanceNm.toFixed(0)} nm`, subtitle: `${facts.nearestToSouthPole.distanceKm.toFixed(0)} km` },
        { label: 'Position', value: `${Math.abs(facts.nearestToSouthPole.latitude).toFixed(2)}°S` },
      ] : [
        { label: 'Status', value: 'No data', highlight: true },
      ],
      insight: facts.nearestToSouthPole
        ? `${facts.nearestToSouthPole.vesselName} is ${facts.nearestToSouthPole.distanceNm.toFixed(0)}nm from the South Pole!`
        : 'Tracking ships near Antarctic waters...',
    },
    {
      title: '⚡ Ships Moving Right Now',
      emoji: '⚡',
      metrics: [
        { label: 'Ships Moving', value: facts.realTimeStats.shipsMovingNow.toLocaleString(), highlight: true },
        { label: 'Ships at Anchor', value: facts.realTimeStats.shipsAtAnchor.toLocaleString() },
        { label: 'On the Equator', value: `${facts.realTimeStats.shipsOnEquator} ships`, subtitle: 'Within 2nm of 0°' },
      ],
      insight: `Right now: ${facts.realTimeStats.shipsMovingNow.toLocaleString()} ships are actively sailing the seas!`,
    },
    {
      title: '🌍 Global Chokepoints',
      emoji: '🌍',
      metrics: [
        { label: 'At Suez Canal', value: facts.realTimeStats.shipsAtSuez.toString(), highlight: true },
        { label: 'At Cape of Good Hope', value: facts.realTimeStats.shipsAtCapeOfGoodHope.toString(), highlight: true },
        { label: 'Coverage Area', value: `${facts.realTimeStats.coverageSqMiles.toLocaleString()} sq mi`, subtitle: `${facts.realTimeStats.coverageSqKm.toLocaleString()} sq km` },
      ],
      insight: `Mari8X tracks ${facts.realTimeStats.coverageSqMiles.toLocaleString()} square miles of ocean - that's bigger than most countries!`,
    },
  ];

  const activeFact = funFactsData[activeFactIndex];

  return (
    <div className="space-y-8">
      {/* Main Fun Fact Carousel */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">{activeFact.emoji}</span>
              {activeFact.title}
            </h3>
            <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-400 text-xs font-semibold animate-pulse">
              ● LIVE
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="flex gap-2">
            {funFactsData.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveFactIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeFactIndex
                    ? 'bg-cyan-400 w-8'
                    : 'bg-blue-400/30 hover:bg-blue-400/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {activeFact.metrics.map((metric, index) => (
            <div
              key={index}
              className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 ${
                metric.highlight ? 'border-2 border-cyan-500/50' : 'border border-white/10'
              }`}
            >
              <div className="text-blue-300 text-sm font-medium mb-2">{metric.label}</div>
              <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
              {metric.subtitle && (
                <div className="text-sm text-cyan-400">{metric.subtitle}</div>
              )}
            </div>
          ))}
        </div>

        {/* Insight */}
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <p className="text-cyan-100 text-lg">{activeFact.insight}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">🌊</div>
          <div className="text-2xl font-bold text-cyan-400 mb-1">
            {facts.dataScale.totalPositions.toLocaleString()}
          </div>
          <div className="text-xs text-blue-300">AIS Positions</div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">🚢</div>
          <div className="text-2xl font-bold text-purple-400 mb-1">
            {facts.dataScale.uniqueVessels.toLocaleString()}
          </div>
          <div className="text-xs text-blue-300">Vessels Tracked</div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">⚡</div>
          <div className="text-2xl font-bold text-green-400 mb-1">
            {facts.realTimeStats.shipsMovingNow.toLocaleString()}
          </div>
          <div className="text-xs text-blue-300">Moving Now</div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">🌍</div>
          <div className="text-2xl font-bold text-orange-400 mb-1">
            {facts.realTimeStats.coverageSqMiles.toLocaleString()}
          </div>
          <div className="text-xs text-blue-300">Sq Miles Tracked</div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">🛤️</div>
          <div className="text-2xl font-bold text-pink-400 mb-1">
            {facts.realTimeStats.shipsAtSuez}
          </div>
          <div className="text-xs text-blue-300">At Suez Now</div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">⚓</div>
          <div className="text-2xl font-bold text-teal-400 mb-1">
            {facts.realTimeStats.shipsOnEquator}
          </div>
          <div className="text-xs text-blue-300">On Equator</div>
        </div>
      </div>

      {/* Last 7 Days Trend (Mini Chart) - BRIGHTENED */}
      {facts.last7DaysTrend.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900/80 to-blue-900/50 backdrop-blur-md border-2 border-cyan-500/40 rounded-xl p-6 shadow-xl">
          <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            📈 Last 7 Days Activity
            <span className="text-sm font-normal text-cyan-400">
              ({facts.last7DaysTrend.reduce((sum, d) => sum + d.count, 0).toLocaleString()} total positions)
            </span>
          </h4>
          <div className="relative bg-black/50 rounded-lg p-6 border border-cyan-500/20" style={{ height: '240px' }}>
            <div className="flex items-end justify-between gap-4 h-full">
              {facts.last7DaysTrend.map((day, index) => {
                const maxCount = Math.max(...facts.last7DaysTrend.map(d => d.count));
                const heightPx = Math.max((day.count / maxCount) * 180, 10); // 180px max height, 10px minimum

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="relative group w-full flex items-end justify-center" style={{ height: '200px' }}>
                      <div
                        className="w-full bg-gradient-to-t from-cyan-400 via-blue-400 to-purple-500 rounded-t-lg shadow-lg transition-all hover:from-cyan-300 hover:via-blue-300 hover:to-purple-400 hover:shadow-2xl hover:shadow-cyan-500/50 border-2 border-cyan-500/50"
                        style={{ height: `${heightPx}px` }}
                      >
                        {/* Glow effect overlay */}
                        <div className="w-full h-full bg-gradient-to-t from-white/20 to-white/40 rounded-t-lg"></div>
                      </div>
                      {/* Tooltip on hover */}
                      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-cyan-600 to-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none border-2 border-cyan-400 shadow-2xl z-10 scale-0 group-hover:scale-100">
                        <div className="text-center">
                          <div className="text-lg">{day.count.toLocaleString()}</div>
                          <div className="text-xs text-cyan-200">positions</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-cyan-200 bg-black/40 px-2 py-1 rounded border border-cyan-500/30">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center text-xs text-blue-400">
        Last updated: {new Date(facts.lastUpdated).toLocaleString()} • Auto-refreshing every 30s
      </div>
    </div>
  );
}
