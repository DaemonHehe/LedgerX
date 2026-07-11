export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 border border-black rounded-none ${className}`}
      aria-hidden="true"
    />
  );
}

export function TemplateCardSkeleton() {
  return (
    <div className="border border-black rounded-none p-5 space-y-3 bg-[var(--bg-primary)]">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

export function TemplateGallerySkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <TemplateCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function DashboardGridSkeleton() {
  return (
    <div className="dashboard-skeleton rounded-none border border-black p-4 space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-8 w-full" />
      ))}
    </div>
  );
}
