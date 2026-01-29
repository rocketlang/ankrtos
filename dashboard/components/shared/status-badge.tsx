import { Badge } from '@/components/ui/badge';
import { cn, capitalize } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  // Container
  announced: 'bg-blue-100 text-blue-800',
  gated_in: 'bg-green-100 text-green-800',
  grounded: 'bg-emerald-100 text-emerald-800',
  on_hold: 'bg-red-100 text-red-800',
  departed: 'bg-gray-100 text-gray-800',
  picked: 'bg-orange-100 text-orange-800',
  // Gate
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  // Customs
  pending: 'bg-amber-100 text-amber-800',
  assessed: 'bg-blue-100 text-blue-800',
  out_of_charge: 'bg-green-100 text-green-800',
  let_export: 'bg-green-100 text-green-800',
  // Billing
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-800',
  overdue: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  // Equipment
  active: 'bg-green-100 text-green-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  breakdown: 'bg-red-100 text-red-800',
  // Generic
  open: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

export function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800';
  return (
    <Badge variant="outline" className={cn('border-0', colorClass)}>
      {capitalize(status)}
    </Badge>
  );
}
