/**
 * StatsFilter - Compact clickable stats with navigation
 */
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface StatItem {
  id: string;
  label: string;
  value: number | string;
  color: 'green' | 'red' | 'blue' | 'yellow' | 'orange' | 'purple' | 'gray';
  icon?: string;
  linkTo?: string;
}

interface StatsFilterProps {
  stats: StatItem[];
  activeFilter?: string;
  onFilterChange?: (id: string) => void;
  columns?: number;
}

export function StatsFilter({ stats, activeFilter, onFilterChange, columns = 6 }: StatsFilterProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const colorConfig: Record<string, { border: string; text: string; bg: string }> = {
    green: { border: 'border-green-500', text: 'text-green-500', bg: 'bg-green-500/10' },
    red: { border: 'border-red-500', text: 'text-red-500', bg: 'bg-red-500/10' },
    blue: { border: 'border-blue-500', text: 'text-blue-500', bg: 'bg-blue-500/10' },
    yellow: { border: 'border-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    orange: { border: 'border-orange-500', text: 'text-orange-500', bg: 'bg-orange-500/10' },
    purple: { border: 'border-purple-500', text: 'text-purple-500', bg: 'bg-purple-500/10' },
    gray: { border: 'border-gray-500', text: 'text-gray-500', bg: 'bg-gray-500/10' },
  };

  const bg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const muted = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  const handleClick = (stat: StatItem) => {
    if (stat.linkTo) {
      navigate(stat.linkTo);
    }
    onFilterChange?.(stat.id);
  };

  const gridCols: Record<number, string> = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div className={`grid ${gridCols[columns] || 'grid-cols-6'} gap-2`}>
      {stats.map((stat) => {
        const colors = colorConfig[stat.color] || colorConfig.gray;
        const isActive = activeFilter === stat.id;

        return (
          <button
            key={stat.id}
            onClick={() => handleClick(stat)}
            className={`${bg} rounded-lg p-2 border-l-2 ${colors.border} hover:scale-[1.02] transition cursor-pointer text-left
              ${isActive ? `ring-1 ring-offset-1 ring-offset-gray-900 ${colors.border.replace('border', 'ring')}` : ''}`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              {stat.icon && <span className="text-base">{stat.icon}</span>}
              <span className={`text-xl font-bold ${colors.text}`}>{stat.value}</span>
            </div>
            <div className={`text-[10px] ${muted}`}>{stat.label}</div>
            <div className={`text-[9px] ${muted} mt-0.5`}>Click to view →</div>
          </button>
        );
      })}
    </div>
  );
}

export default StatsFilter;


// FilterIndicator - used by Orders page
export function FilterIndicator({ active, label }: { active: boolean; label: string }) {
  return active ? (
    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
      Filtered: {label}
    </span>
  ) : null;
}
