export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8">
      <div className="mb-2 h-3 w-24 animate-pulse rounded bg-slate-200" />
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="dashboard-card p-5 space-y-3">
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
