export default function PracticeLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf9]">
      {/* Progress header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3 lg:px-8">
          <div className="h-4 w-12 rounded bg-slate-200 animate-pulse shrink-0" />
          <div className="h-2 flex-1 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-4 w-10 rounded bg-slate-200 animate-pulse shrink-0" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 lg:px-8">
        {/* Question card */}
        <div className="dashboard-card mb-6 p-6">
          <div className="mb-4 h-6 w-12 rounded-lg bg-slate-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-slate-200 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
          </div>
        </div>

        {/* Options */}
        <div className="mb-6 space-y-3">
          {['A', 'B', 'C', 'D'].map((label) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border-2 border-slate-100 bg-white p-4"
            >
              <div className="h-7 w-7 shrink-0 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-4 flex-1 rounded bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <div className="h-12 w-36 rounded-xl bg-slate-200 animate-pulse" />
        </div>
      </main>
    </div>
  )
}
