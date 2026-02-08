/**
 * JOURNEY PLAYBACK CONTROLLER
 * Animate vessel movement over time with timeline scrubbing
 */

import { useState, useEffect, useRef } from 'react';

interface PlaybackWaypoint {
  lat: number;
  lon: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

interface JourneySegment {
  type: string;
  startTime: Date;
  endTime: Date;
  playbackWaypoints?: PlaybackWaypoint[];
}

interface JourneyPlaybackProps {
  segments: JourneySegment[];
  onPositionChange: (position: { lat: number; lon: number; timestamp: Date } | null) => void;
}

export default function JourneyPlayback({ segments, onPositionChange }: JourneyPlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 4x, 10x
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const animationRef = useRef<number>();

  // Calculate journey timeline
  const startTime = segments.length > 0
    ? new Date(Math.min(...segments.map(s => new Date(s.startTime).getTime())))
    : new Date();
  const endTime = segments.length > 0
    ? new Date(Math.max(...segments.map(s => new Date(s.endTime).getTime())))
    : new Date();

  // Initialize current time to start
  useEffect(() => {
    if (!currentTime && segments.length > 0) {
      setCurrentTime(startTime);
    }
  }, [segments, currentTime, startTime]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !currentTime) return;

    const animate = () => {
      setCurrentTime((prev) => {
        if (!prev) return startTime;

        const newTime = new Date(prev.getTime() + 1000 * speed);
        if (newTime > endTime) {
          setIsPlaying(false);
          return endTime;
        }

        // Find position at this time
        const position = getPositionAtTime(segments, newTime);
        onPositionChange(position ? { ...position, timestamp: newTime } : null);

        return newTime;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, speed, endTime, segments, onPositionChange, startTime]);

  const handleTimelineChange = (value: number) => {
    const newTime = new Date(value);
    setCurrentTime(newTime);
    const position = getPositionAtTime(segments, newTime);
    onPositionChange(position ? { ...position, timestamp: newTime } : null);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(startTime);
    const position = getPositionAtTime(segments, startTime);
    onPositionChange(position ? { ...position, timestamp: startTime } : null);
  };

  if (segments.length === 0) {
    return null;
  }

  const progress = currentTime
    ? ((currentTime.getTime() - startTime.getTime()) / (endTime.getTime() - startTime.getTime())) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg shadow border p-4 mb-4">
      <div className="flex items-center gap-4">
        {/* Play/Pause/Reset buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            ⏮️ Reset
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Speed:</label>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
            <option value={10}>10x</option>
          </select>
        </div>

        {/* Current timestamp */}
        <div className="flex-1 text-sm text-gray-600">
          {currentTime && (
            <span>
              {currentTime.toLocaleString()} ({progress.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {/* Timeline scrubber */}
      <div className="mt-4">
        <input
          type="range"
          min={startTime.getTime()}
          max={endTime.getTime()}
          value={currentTime?.getTime() || startTime.getTime()}
          onChange={(e) => handleTimelineChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{startTime.toLocaleTimeString()}</span>
          <span>{endTime.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

// Helper to find position at specific time
function getPositionAtTime(
  segments: JourneySegment[],
  time: Date
): { lat: number; lon: number } | null {
  // Find segment containing this timestamp
  const segment = segments.find(
    (s) =>
      new Date(s.startTime).getTime() <= time.getTime() &&
      new Date(s.endTime).getTime() >= time.getTime()
  );

  if (!segment || !segment.playbackWaypoints || segment.playbackWaypoints.length === 0) {
    return null;
  }

  const waypoints = segment.playbackWaypoints;

  // Find waypoints bracketing this time
  let idx = waypoints.findIndex((w, i) => {
    const wTime = new Date(w.timestamp).getTime();
    const nextTime = i < waypoints.length - 1 ? new Date(waypoints[i + 1].timestamp).getTime() : Infinity;
    return time.getTime() >= wTime && time.getTime() < nextTime;
  });

  if (idx === -1) {
    // Return last waypoint if time is past all waypoints
    return waypoints[waypoints.length - 1];
  }

  if (idx === waypoints.length - 1) {
    return waypoints[idx];
  }

  // Interpolate between waypoints
  const w1 = waypoints[idx];
  const w2 = waypoints[idx + 1];
  const t1 = new Date(w1.timestamp).getTime();
  const t2 = new Date(w2.timestamp).getTime();
  const progress = (time.getTime() - t1) / (t2 - t1);

  return {
    lat: w1.lat + (w2.lat - w1.lat) * progress,
    lon: w1.lon + (w2.lon - w1.lon) * progress,
  };
}
