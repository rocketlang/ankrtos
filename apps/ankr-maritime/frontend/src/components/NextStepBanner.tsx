import { Link, useLocation } from 'react-router-dom';
import { nextStepMap } from '../lib/sidebar-nav';

export function NextStepBanner() {
  const { pathname } = useLocation();
  const next = nextStepMap[pathname];

  if (!next) return null;

  return (
    <div className="mt-6 mx-8 mb-4">
      <div className="bg-maritime-800 border border-maritime-700/50 rounded-lg px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-maritime-600 text-sm">{'\u279C'}</span>
          <span className="text-maritime-400 text-sm">
            Next in operations flow:{' '}
            <span className="text-maritime-300">{next.description}</span>
          </span>
        </div>
        <Link
          to={next.href}
          className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm font-medium px-4 py-1.5 rounded-md transition-colors"
        >
          Next: {next.label} {'\u2192'}
        </Link>
      </div>
    </div>
  );
}
