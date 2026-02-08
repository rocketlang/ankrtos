/**
 * AIS Global Heatmap Component
 *
 * Shows all AIS positions as a heatmap on a scrollable world map
 * Data updated once daily for performance
 */

import { useQuery } from '@apollo/client';
import { gql } from '../__generated__/gql';
import { useEffect, useRef } from 'react';

const AIS_HEATMAP_DATA_QUERY = gql(`
  query AISHeatmapData {
    aisHeatmapData {
      points {
        lat
        lng
        intensity
      }
      totalPoints
      lastUpdated
    }
  }
`);

export default function AISGlobalHeatmap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, loading, error } = useQuery(AIS_HEATMAP_DATA_QUERY, {
    fetchPolicy: 'cache-first', // Data cached and updated daily on backend
    errorPolicy: 'ignore',
    // Heatmap enabled - backend provides aggregated data
    skip: false,
  });

  useEffect(() => {
    if (!data?.aisHeatmapData?.points || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (world map aspect ratio ~2:1)
    const width = 1200;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    // Natural map background - Ocean blue
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a4d6b');    // Deep blue at top
    gradient.addColorStop(0.5, '#2563a8'); // Medium blue at equator
    gradient.addColorStop(1, '#1a4d6b');    // Deep blue at bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Helper to convert lat/lng to canvas coordinates
    const toX = (lng: number) => ((lng + 180) / 360) * width;
    const toY = (lat: number) => ((90 - lat) / 180) * height;

    // Draw filled continents with natural earth tones
    const landGradient = ctx.createLinearGradient(0, 0, 0, height);
    landGradient.addColorStop(0, '#7a9b76');    // Green (northern)
    landGradient.addColorStop(0.3, '#8fb885');  // Light green
    landGradient.addColorStop(0.5, '#c4b896');  // Tan/beige (equator)
    landGradient.addColorStop(0.7, '#8fb885');  // Light green
    landGradient.addColorStop(1, '#7a9b76');    // Green (southern)

    // Draw and fill continents
    ctx.fillStyle = landGradient;
    ctx.strokeStyle = '#5a7a56'; // Dark green borders
    ctx.lineWidth = 1.5;

    // North America
    ctx.beginPath();
    ctx.moveTo(toX(-170), toY(65));
    ctx.lineTo(toX(-130), toY(55));
    ctx.lineTo(toX(-65), toY(48));
    ctx.lineTo(toX(-80), toY(25));
    ctx.lineTo(toX(-105), toY(18));
    ctx.lineTo(toX(-118), toY(32));
    ctx.lineTo(toX(-130), toY(50));
    ctx.lineTo(toX(-170), toY(65));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Europe
    ctx.beginPath();
    ctx.moveTo(toX(-10), toY(62));
    ctx.lineTo(toX(30), toY(70));
    ctx.lineTo(toX(40), toY(50));
    ctx.lineTo(toX(10), toY(36));
    ctx.lineTo(toX(-10), toY(40));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Africa
    ctx.beginPath();
    ctx.moveTo(toX(-17), toY(37));
    ctx.lineTo(toX(52), toY(32));
    ctx.lineTo(toX(42), toY(-35));
    ctx.lineTo(toX(18), toY(-35));
    ctx.lineTo(toX(10), toY(8));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Asia
    ctx.beginPath();
    ctx.moveTo(toX(40), toY(72));
    ctx.lineTo(toX(180), toY(65));
    ctx.lineTo(toX(150), toY(42));
    ctx.lineTo(toX(100), toY(5));
    ctx.lineTo(toX(60), toY(32));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Australia
    ctx.beginPath();
    ctx.moveTo(toX(113), toY(-10));
    ctx.lineTo(toX(155), toY(-12));
    ctx.lineTo(toX(152), toY(-42));
    ctx.lineTo(toX(113), toY(-38));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // South America
    ctx.beginPath();
    ctx.moveTo(toX(-82), toY(12));
    ctx.lineTo(toX(-48), toY(-5));
    ctx.lineTo(toX(-70), toY(-55));
    ctx.lineTo(toX(-82), toY(-22));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([5, 5]); // Dashed lines

    // Latitude lines
    for (let lat = -90; lat <= 90; lat += 30) {
      const y = ((90 - lat) / 180) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Longitude lines
    for (let lng = -180; lng <= 180; lng += 30) {
      const x = ((lng + 180) / 360) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Reset line dash for other drawings
    ctx.setLineDash([]);

    // Create heatmap points
    const points = data.aisHeatmapData.points;

    // Find max intensity for normalization
    const maxIntensity = Math.max(...points.map(p => p.intensity));

    // Draw each point with intensity-based color
    points.forEach(point => {
      const x = ((point.lng + 180) / 360) * width;
      const y = ((90 - point.lat) / 180) * height;

      // Normalize intensity (0-1 scale) with logarithmic scaling for better visualization
      const normalized = Math.log(point.intensity + 1) / Math.log(maxIntensity + 1);
      const intensity = Math.min(normalized, 1);

      // Create gradient for heat effect with larger radius for high intensity
      const radius = 4 + (intensity * 12); // 4-16px radius - MUCH BRIGHTER
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

      if (intensity > 0.8) {
        // Red - very high traffic (BRIGHTENED)
        gradient.addColorStop(0, `rgba(255, 80, 80, 1)`);
        gradient.addColorStop(0.4, `rgba(255, 50, 50, 0.9)`);
        gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
      } else if (intensity > 0.6) {
        // Orange - high traffic (BRIGHTENED)
        gradient.addColorStop(0, `rgba(255, 180, 50, 1)`);
        gradient.addColorStop(0.4, `rgba(255, 150, 0, 0.9)`);
        gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
      } else if (intensity > 0.4) {
        // Yellow - medium traffic (BRIGHTENED)
        gradient.addColorStop(0, `rgba(255, 255, 100, 1)`);
        gradient.addColorStop(0.4, `rgba(255, 255, 0, 0.9)`);
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      } else {
        // Cyan/Blue - low traffic (BRIGHTENED)
        gradient.addColorStop(0, `rgba(0, 255, 255, 0.95)`);
        gradient.addColorStop(0.4, `rgba(0, 200, 255, 0.8)`);
        gradient.addColorStop(1, 'rgba(0, 200, 255, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [data]);

  if (loading && !data) {
    return (
      <div className="bg-gradient-to-r from-slate-900/30 to-blue-900/30 border border-blue-500/30 rounded-2xl p-8">
        <div className="text-center text-blue-300">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <div>Loading global vessel heatmap...</div>
        </div>
      </div>
    );
  }

  if (error || !data?.aisHeatmapData) {
    // Silent fail with fallback message
    return (
      <div className="bg-gradient-to-r from-slate-900/30 to-blue-900/30 border border-blue-500/30 rounded-2xl p-8">
        <div className="text-center text-blue-300">
          <div className="text-4xl mb-4">🌍</div>
          <div>Global vessel heatmap coming soon</div>
          <div className="text-xs text-blue-400 mt-2">Tracking millions of vessel positions worldwide</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-4xl">🌍</span>
            Global Vessel Heatmap
          </h3>
          <div className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 text-xs font-semibold">
            {data.aisHeatmapData.totalPoints.toLocaleString()} POSITIONS
          </div>
        </div>
        <div className="text-xs text-blue-400">
          Updated: {new Date(data.aisHeatmapData.lastUpdated).toLocaleDateString()}
        </div>
      </div>

      {/* Heatmap Container */}
      <div
        ref={containerRef}
        className="bg-gradient-to-r from-slate-900/50 to-blue-900/50 border border-blue-500/30 rounded-2xl p-6 overflow-auto"
        style={{ maxHeight: '600px' }}
      >
        <canvas
          ref={canvasRef}
          className="mx-auto rounded-lg shadow-2xl"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Legend */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
        <div className="flex items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <span className="text-xs text-blue-300">Low Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span className="text-xs text-blue-300">Medium Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-400 rounded"></div>
            <span className="text-xs text-blue-300">High Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-400 rounded"></div>
            <span className="text-xs text-blue-300">Very High Traffic</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400 mb-1">
            {data.aisHeatmapData.totalPoints.toLocaleString()}
          </div>
          <div className="text-xs text-blue-300">Total Positions</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400 mb-1">
            {data.aisHeatmapData.points.length.toLocaleString()}
          </div>
          <div className="text-xs text-blue-300">Heat Points</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">Daily</div>
          <div className="text-xs text-blue-300">Update Frequency</div>
        </div>
      </div>
    </div>
  );
}
