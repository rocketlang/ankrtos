/**
 * 📱 Embedded Page Adapter
 * 
 * This allows existing pages (Orders, Trips, etc.) to work both:
 * 1. As standalone pages (via sidebar navigation)
 * 2. As embedded content inside drawers (in Command Center)
 * 
 * Usage in page components:
 * 
 *   interface Props {
 *     embedded?: boolean;
 *   }
 *   
 *   export default function Orders({ embedded }: Props) {
 *     if (embedded) {
 *       return <OrdersContent />;  // No outer wrapper
 *     }
 *     return (
 *       <PageWrapper title="Orders">
 *         <OrdersContent />
 *       </PageWrapper>
 *     );
 *   }
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface EmbeddedWrapperProps {
  children: React.ReactNode;
  embedded?: boolean;
  title?: string;
}

/**
 * Wrapper that removes page chrome when embedded in drawer
 */
export function EmbeddedWrapper({ children, embedded, title }: EmbeddedWrapperProps) {
  const { theme } = useTheme();
  const isDark = theme !== 'light';

  // When embedded in drawer, return just the content
  if (embedded) {
    return <>{children}</>;
  }

  // When standalone, include page wrapper
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {title && (
        <header className={`px-4 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h1>
        </header>
      )}
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}

/**
 * HOC to make any component embeddable
 */
export function withEmbedded<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) {
  const WrappedComponent = (props: P & { embedded?: boolean }) => {
    const { embedded, ...rest } = props;
    
    if (embedded) {
      return <Component {...(rest as P)} />;
    }
    
    return <Component {...(rest as P)} />;
  };
  
  WrappedComponent.displayName = displayName || `withEmbedded(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default EmbeddedWrapper;
