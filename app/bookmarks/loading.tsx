export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <div className="mb-6">
        <div className="mb-3 h-3 w-20 animate-pulse rounded bg-slate-200" />
        <div className="h-7 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-1 h-4 w-28 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dashboard-card overflow-hidden">
            <div className="flex gap-2 border-b border-slate-100 px-4 py-2.5">
              <div className="h-5 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-16 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="px-4 py-3">
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="flex justify-between border-t border-slate-100 px-4 py-2.5">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-7 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
