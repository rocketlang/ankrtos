/**
 * @ankr-bfc/ui
 *
 * BFC UI Component Library
 * Banking-focused React components with TailwindCSS
 *
 * @example
 * ```tsx
 * import { Button, Card, StatCard, StatusBadge } from '@ankr-bfc/ui';
 * import { formatINR, formatDate } from '@ankr-bfc/ui';
 *
 * function Dashboard() {
 *   return (
 *     <Card>
 *       <StatCard
 *         title="Total Balance"
 *         value={245678}
 *         format="currency"
 *         change={12.5}
 *       />
 *       <StatusBadge status="approved" />
 *       <Button variant="primary">Apply Now</Button>
 *     </Card>
 *   );
 * }
 * ```
 */

// Components
export * from './components/index.js';

// Utilities
export * from './utils.js';
