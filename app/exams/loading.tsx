export default function ExamsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
      {/* Breadcrumb skeleton */}
      <div className="mb-7">
        <div className="mb-2 h-4 w-40 rounded bg-slate-200 animate-pulse" />
        <div className="h-8 w-56 rounded-lg bg-slate-200 animate-pulse" />
        <div className="mt-2 h-4 w-72 rounded bg-slate-100 animate-pulse" />
      </div>

      {/* Search skeleton */}
      <div className="mb-5 h-10 w-64 rounded-xl bg-slate-200 animate-pulse" />

      {/* Filter pills skeleton */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-lg bg-slate-200 animate-pulse" />
        ))}
      </div>

      {/* Exam grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="dashboard-card flex items-center gap-3 p-5">
            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
