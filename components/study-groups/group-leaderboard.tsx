'use client'

interface Entry {
  userId: string
  name: string
  totalAnswered: number
  accuracy: number
  challengeScore: number
  challengeCount: number
}

interface Props {
  leaderboard: Entry[]
  currentUserId: string
}

export default function GroupLeaderboard({ leaderboard, currentUserId }: Props) {
  const medals = ['🥇', '🥈', '🥉']

  if (leaderboard.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center">
        <p className="text-sm font-medium text-slate-700">No activity yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Complete practice questions and challenges to appear on the leaderboard.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="section-title mb-1">Leaderboard</h2>
      <p className="mb-5 text-xs text-slate-500">Ranked by overall accuracy, then questions answered.</p>

      <div className="space-y-2">
        {leaderboard.map((entry, i) => {
          const isMe = entry.userId === currentUserId
          return (
            <div
              key={entry.userId}
              className={`dashboard-card flex items-center gap-3 px-4 py-3 ${isMe ? 'border-emerald-300 bg-emerald-50' : ''}`}
            >
              <div className="w-6 shrink-0 text-center">
                {i < 3 ? (
                  <span className="text-base">{medals[i]}</span>
                ) : (
                  <span className="text-sm text-slate-500">{i + 1}</span>
                )}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                {entry.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-semibold ${isMe ? 'text-emerald-800' : 'text-slate-800'}`}>
                    {entry.name}
                  </span>
                  {isMe && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                      You
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex gap-3 text-[11px] text-slate-500">
                  <span>{entry.totalAnswered} questions</span>
                  {entry.challengeCount > 0 && (
                    <span>{entry.challengeCount} challenge{entry.challengeCount !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className={`text-lg font-bold ${entry.accuracy >= 80 ? 'text-emerald-600' : entry.accuracy >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {entry.totalAnswered > 0 ? `${entry.accuracy}%` : '—'}
                </div>
                <div className="text-[10px] text-slate-400">accuracy</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
