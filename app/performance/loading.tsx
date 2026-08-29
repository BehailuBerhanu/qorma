export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <div className="mb-3 h-3 w-20 animate-pulse rounded bg-slate-200" />
      <div className="mb-7">
        <div className="h-7 w-36 animate-pulse rounded bg-slate-200" />
        <div className="mt-1 h-4 w-64 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dashboard-card p-4">
            <div className="mb-2 h-8 w-8 animate-pulse rounded-full bg-slate-100" />
            <div className="h-8 w-16 animate-pulse rounded bg-slate-200" />
            <div className="mt-1 h-3 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="dashboard-card p-5 mb-6">
        <div className="mb-4 h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-[180px] animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="dashboard-card p-5">
        <div className="mb-5 h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
              <div className="flex-1">
                <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                <div className="mt-1.5 h-1.5 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
