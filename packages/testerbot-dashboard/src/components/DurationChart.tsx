import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { DurationData } from '../types';

interface DurationChartProps {
  data: DurationData[];
}

export function DurationChart({ data }: DurationChartProps) {
  const avgAll = data.reduce((acc, d) => acc + d.duration, 0) / data.length;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Test Duration by Suite</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000).toFixed(1)}s`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${(value / 1000).toFixed(2)}s`, '']}
            />
            <ReferenceLine y={avgAll} stroke="#f97316" strokeDasharray="5 5" label={{ value: 'Avg', fill: '#f97316', position: 'right' }} />
            <Area
              type="monotone"
              dataKey="duration"
              stroke="#8b5cf6"
              fill="url(#durationGradient)"
              name="Duration"
            />
            <defs>
              <linearGradient id="durationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
