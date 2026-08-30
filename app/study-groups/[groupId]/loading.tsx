export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header skeleton */}
      <div className="border-b border-slate-200 bg-[#03251d] px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-2 h-3 w-20 animate-pulse rounded bg-emerald-800" />
          <div className="h-8 w-64 animate-pulse rounded bg-emerald-800" />
          <div className="mt-2 flex gap-3">
            <div className="h-5 w-16 animate-pulse rounded bg-emerald-800" />
            <div className="h-5 w-20 animate-pulse rounded bg-emerald-800" />
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-4xl px-5 py-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="dashboard-card p-4">
              <div className="h-7 w-12 animate-pulse rounded bg-slate-200 mb-1" />
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="dashboard-card p-5 mb-4">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200 mb-4" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="dashboard-card p-4">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200 mb-2" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
