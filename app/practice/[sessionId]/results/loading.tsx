export default function ResultsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      {/* Score card */}
      <div className="mb-7 h-56 rounded-2xl bg-slate-200 animate-pulse" />

      {/* CTA buttons */}
      <div className="mb-8 flex gap-3">
        <div className="h-10 w-44 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-10 w-40 rounded-xl bg-slate-200 animate-pulse" />
      </div>

      {/* Question review header */}
      <div className="mb-4 h-5 w-36 rounded bg-slate-200 animate-pulse" />

      {/* Answer rows */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="dashboard-card flex items-center gap-3 p-4">
            <div className="h-5 w-5 shrink-0 rounded-full bg-slate-200 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-slate-100 animate-pulse" />
            </div>
            <div className="h-4 w-8 shrink-0 rounded bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
