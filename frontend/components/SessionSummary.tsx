'use client'

interface SessionResult {
  id: number
  german: string
  english: string
  difficulty: number
  confidence: number
}

interface SessionSummaryProps {
  results: SessionResult[]
  onRestart: () => void
}

export default function SessionSummary({ results, onRestart }: SessionSummaryProps) {
  const total = results.length
  const gotIt = results.filter(r => r.difficulty >= 3).length
  const practice = total - gotIt
  const avgConfidence = total > 0
    ? Math.round(results.reduce((a, b) => a + b.confidence, 0) / total)
    : 0

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Session Complete 🎉</h2>
        <span className="text-sm text-gray-400">{total} phrases</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-green-400">{gotIt}</div>
          <div className="text-sm text-gray-400">Got it</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-yellow-400">{practice}</div>
          <div className="text-sm text-gray-400">Need practice</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-blue-400">{avgConfidence}%</div>
          <div className="text-sm text-gray-400">Avg confidence</div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Review</h3>
        <div className="space-y-2 max-h-48 overflow-auto pr-1">
          {results.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-gray-900 rounded-lg p-3 border border-gray-700">
              <div>
                <div className="font-medium text-gray-100">{r.german}</div>
                <div className="text-xs text-gray-400">{r.english}</div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-xs px-2 py-1 rounded ${r.difficulty >= 3 ? 'bg-green-600/20 text-green-300 border border-green-600/40' : 'bg-yellow-600/20 text-yellow-200 border border-yellow-600/40'}`}>
                  {r.difficulty >= 3 ? 'Got it' : 'Practice'}
                </span>
                <span className="text-xs text-gray-400">{r.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors"
        >
          Start New Session
        </button>
      </div>
    </div>
  )
}

