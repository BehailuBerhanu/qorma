export default function ExamDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-5 h-4 w-48 rounded bg-slate-200 animate-pulse" />

      {/* Header card */}
      <div className="mb-7 h-32 rounded-2xl bg-slate-200 animate-pulse" />

      {/* Section title */}
      <div className="mb-4 h-5 w-48 rounded bg-slate-200 animate-pulse" />

      {/* Subject cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="dashboard-card flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-slate-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
                <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
              </div>
            </div>
            <div className="h-9 w-24 rounded-lg bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
