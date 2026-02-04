import { Link, useLocation } from 'react-router-dom';
import { flowSteps, flowHrefs } from '../lib/sidebar-nav';

export function WorkflowBreadcrumb() {
  const { pathname } = useLocation();

  // Only render on flow pages
  if (!flowHrefs.has(pathname)) return null;

  const currentIndex = flowSteps.findIndex((s) => s.href === pathname);

  return (
    <div className="bg-maritime-800/50 border-b border-maritime-700/50 px-6 py-2">
      <div className="flex items-center gap-1 overflow-x-auto text-xs">
        {flowSteps.map((step, i) => {
          const isCurrent = i === currentIndex;
          const isPast = i < currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div key={step.href} className="flex items-center gap-1 flex-shrink-0">
              {i > 0 && (
                <span className={`mx-1 ${isPast ? 'text-green-600' : 'text-maritime-700'}`}>
                  {'\u2192'}
                </span>
              )}
              <Link
                to={step.href}
                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                  isCurrent
                    ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/50 font-medium'
                    : isPast
                    ? 'text-green-400 hover:bg-green-900/20'
                    : isFuture
                    ? 'text-maritime-600 hover:text-maritime-400 hover:bg-maritime-700/30'
                    : ''
                }`}
              >
                {isPast && <span className="text-green-400">{'\u2713'}</span>}
                {step.label}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
