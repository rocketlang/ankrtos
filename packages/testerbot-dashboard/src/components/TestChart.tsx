import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ChartData } from '../types';

interface TestChartProps {
  data: ChartData[];
}

export function TestChart({ data }: TestChartProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Test Results by Day</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="passed" fill="#22c55e" name="Passed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="failed" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="skipped" fill="#f59e0b" name="Skipped" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
