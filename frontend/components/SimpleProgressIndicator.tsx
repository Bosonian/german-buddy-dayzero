'use client'

interface SimpleProgressIndicatorProps {
  status: 'new' | 'practiced' | 'completed'
  compact?: boolean
}

export default function SimpleProgressIndicator({ status, compact = false }: SimpleProgressIndicatorProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'new':
        return {
          color: 'bg-gray-500',
          text: 'New',
          textColor: 'text-gray-400',
          emoji: ''
        }
      case 'practiced':
        return {
          color: 'bg-yellow-500',
          text: 'Practiced',
          textColor: 'text-yellow-400',
          emoji: '⏳'
        }
      case 'completed':
        return {
          color: 'bg-green-500',
          text: 'Completed',
          textColor: 'text-green-400',
          emoji: '✅'
        }
      default:
        return {
          color: 'bg-gray-500',
          text: 'New',
          textColor: 'text-gray-400',
          emoji: ''
        }
    }
  }

  const statusInfo = getStatusInfo(status)

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
        {statusInfo.emoji && (
          <span className="text-xs">{statusInfo.emoji}</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-3 h-3 rounded-full ${statusInfo.color}`} />
      <span className={statusInfo.textColor}>
        {statusInfo.emoji} {statusInfo.text}
      </span>
    </div>
  )
}

// Simple summary for dashboard - just count completed phrases
export function SimpleProgressSummary({ completedCount, totalCount }: {
  completedCount: number
  totalCount: number
}) {
  const percentComplete = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-semibold mb-3">Progress</h3>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Phrases Completed</span>
          <span className="text-white font-medium">{completedCount} / {totalCount}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      <div className="text-center">
        <div className="text-2xl font-bold text-green-400">{Math.round(percentComplete)}%</div>
        <div className="text-xs text-gray-400">Complete</div>
      </div>
    </div>
  )
}