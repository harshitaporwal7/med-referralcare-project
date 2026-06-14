export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex gap-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/5" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/6" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/5" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/6" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6" />
      <div className="h-48 bg-slate-100 dark:bg-slate-700 rounded-xl" />
    </div>
  );
}
