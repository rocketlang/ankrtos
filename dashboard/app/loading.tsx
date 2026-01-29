export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border bg-white" />
        ))}
      </div>
      {/* Table skeleton */}
      <div className="h-96 animate-pulse rounded-xl border bg-white" />
    </div>
  );
}
