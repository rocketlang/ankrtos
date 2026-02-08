import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface PlatformStats {
  ports: {
    total: number;
    withCoordinates: number;
    withOpenSeaMap: number;
    withCharts: number;
  };
  vessels: {
    total: number;
    active: number;
  };
  ais: {
    totalPositions: number;
    last24h: number;
  };
  services: {
    totalPages: number;
    categories: number;
  };
  routes: {
    extracted: number;
    active: number;
  };
  lastUpdated: string;
}

function AnimatedCounter({ value, suffix = '', prefix = '', duration = 2 }: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (current) => {
    if (current >= 1000000) {
      return `${prefix}${(current / 1000000).toFixed(1)}M${suffix}`;
    } else if (current >= 1000) {
      return `${prefix}${(current / 1000).toFixed(1)}k${suffix}`;
    }
    return `${prefix}${Math.floor(current).toLocaleString()}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

export default function LiveStatsWidget() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:4053/api/platform-stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
        setLoading(false);
        setError(false);
      } catch (err) {
        console.error('Failed to fetch platform stats:', err);
        setError(true);
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-r from-blue-950 via-cyan-950 to-blue-900 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-blue-800/30 rounded w-2/3 mx-auto mb-4"></div>
            <div className="h-4 bg-blue-800/20 rounded w-1/2 mx-auto mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-blue-800/20 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return null; // Hide widget on error
  }

  const statCards = [
    {
      icon: '🌍',
      label: 'Ports Worldwide',
      value: stats.ports.total,
      sublabel: `${stats.ports.withOpenSeaMap.toLocaleString()} with detailed charts`,
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: '🚢',
      label: 'AIS Positions Tracked',
      value: stats.ais.totalPositions,
      sublabel: `${stats.ais.last24h.toLocaleString()} in last 24h`,
      color: 'from-blue-500 to-indigo-500',
    },
    {
      icon: '⚓',
      label: 'Charted Ports',
      value: stats.ports.withOpenSeaMap,
      sublabel: 'With OpenSeaMap data',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: '🗺️',
      label: 'Platform Services',
      value: stats.services.totalPages,
      sublabel: `${stats.services.categories} service categories`,
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-blue-950 via-cyan-950 to-blue-900 py-16 px-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-cyan-400"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            World's Most Comprehensive
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mt-2">
              Maritime Intelligence Platform
            </span>
          </h2>
          <p className="text-blue-200 text-lg">
            Real-time data powering maritime operations globally
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:transform hover:scale-105">
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl bg-gradient-to-br ${stat.color} blur-xl`} />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="text-4xl mb-3">{stat.icon}</div>

                  {/* Value */}
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    <AnimatedCounter value={stat.value} />
                  </div>

                  {/* Label */}
                  <div className="text-blue-200 font-medium mb-1">
                    {stat.label}
                  </div>

                  {/* Sublabel */}
                  <div className="text-blue-300/70 text-sm">
                    {stat.sublabel}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <motion.div
              className="w-2 h-2 bg-green-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
            <span className="text-blue-200 text-sm font-medium">
              Live Data • Updated {new Date(stats.lastUpdated).toLocaleTimeString()}
            </span>
          </div>
        </motion.div>

        {/* Coverage percentage badge */}
        {stats.ports.withOpenSeaMap > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8 text-center"
          >
            <div className="inline-block bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm px-6 py-3 rounded-2xl border border-emerald-400/30">
              <div className="text-emerald-300 text-sm font-medium mb-1">
                OpenSeaMap Coverage
              </div>
              <div className="text-2xl font-bold text-white">
                <AnimatedCounter
                  value={Math.round((stats.ports.withOpenSeaMap / stats.ports.total) * 100)}
                  suffix="%"
                  duration={2.5}
                />
                <span className="text-emerald-400 text-lg ml-2">
                  of {stats.ports.total.toLocaleString()} ports
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
