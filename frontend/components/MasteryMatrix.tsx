'use client'

interface MasteryMatrixProps {
  mastery: {
    recognition: number
    production: number
    pronunciation: number
    contextual: number
    cultural: number
    spelling: number
    speed: number
  }
}

export default function MasteryMatrix({ mastery }: MasteryMatrixProps) {
  const dimensions = [
    { key: 'recognition', label: 'Recognition', color: 'blue', icon: '👁️' },
    { key: 'production', label: 'Production', color: 'green', icon: '💬' },
    { key: 'pronunciation', label: 'Pronunciation', color: 'orange', icon: '🎤' },
    { key: 'contextual', label: 'Context', color: 'purple', icon: '🎯' },
    { key: 'cultural', label: 'Cultural', color: 'indigo', icon: '🌍' },
    { key: 'spelling', label: 'Spelling', color: 'pink', icon: '✏️' },
    { key: 'speed', label: 'Speed', color: 'yellow', icon: '⚡' },
  ]

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
      <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center">
        <span className="mr-2">📊</span>
        Mastery Matrix
      </h3>

      <div className="space-y-3">
        {dimensions.map((dim) => {
          const value = mastery[dim.key as keyof typeof mastery]
          const colorClass = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            orange: 'bg-orange-500',
            purple: 'bg-purple-500',
            indigo: 'bg-indigo-500',
            pink: 'bg-pink-500',
            yellow: 'bg-yellow-500',
          }[dim.color]

          return (
            <div key={dim.key} className="flex items-center space-x-3">
              <span className="text-xl w-8">{dim.icon}</span>
              <span className="text-sm font-medium text-gray-300 w-24">
                {dim.label}
              </span>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 ${colorClass} rounded-full transition-all duration-500`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-100 w-12 text-right">
                {value}%
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Overall Progress</span>
          <span className="font-bold text-blue-400">
            {Math.round(
              Object.values(mastery).reduce((a, b) => a + b, 0) /
              Object.values(mastery).length
            )}% Complete
          </span>
        </div>
      </div>
    </div>
  )
}