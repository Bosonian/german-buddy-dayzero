'use client'

import { PhraseProgress } from '@/lib/phraseProgress'

interface PhraseProgressIndicatorProps {
  progress: PhraseProgress | null
  compact?: boolean
}

export default function PhraseProgressIndicator({ progress, compact = false }: PhraseProgressIndicatorProps) {
  if (!progress) {
    return (
      <div className={`flex items-center ${compact ? 'space-x-1' : 'space-x-2'}`}>
        <div className={`w-2 h-2 rounded-full bg-gray-600`} />
        <span className={`text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>New</span>
      </div>
    )
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'new':
        return {
          color: 'bg-gray-500',
          text: 'New',
          textColor: 'text-gray-400',
          emoji: '🆕'
        }
      case 'familiar':
        return {
          color: 'bg-blue-500',
          text: 'Familiar',
          textColor: 'text-blue-400',
          emoji: '👁️'
        }
      case 'learning':
        return {
          color: 'bg-yellow-500',
          text: 'Learning',
          textColor: 'text-yellow-400',
          emoji: '📚'
        }
      case 'mastered':
        return {
          color: 'bg-green-500',
          text: 'Mastered',
          textColor: 'text-green-400',
          emoji: '✅'
        }
      default:
        return {
          color: 'bg-gray-500',
          text: 'Unknown',
          textColor: 'text-gray-400',
          emoji: '❓'
        }
    }
  }

  const statusInfo = getStatusInfo(progress.status)
  const successRate = progress.exposures > 0 ? (progress.successCount / progress.exposures) * 100 : 0
  const avgConfidence = progress.exposures > 0 ? progress.totalConfidence / progress.exposures : 0

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
        <span className={`text-xs ${statusInfo.textColor}`}>
          {statusInfo.emoji} {statusInfo.text}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${statusInfo.color}`} />
          <span className={`font-semibold ${statusInfo.textColor}`}>
            {statusInfo.emoji} {statusInfo.text}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {progress.exposures} exposure{progress.exposures !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Progress metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-400">Success:</span>
          <span className={`ml-1 font-medium ${successRate >= 60 ? 'text-green-400' : 'text-yellow-400'}`}>
            {Math.round(successRate)}%
          </span>
        </div>
        <div>
          <span className="text-gray-400">Confidence:</span>
          <span className={`ml-1 font-medium ${avgConfidence >= 55 ? 'text-green-400' : 'text-yellow-400'}`}>
            {Math.round(avgConfidence)}%
          </span>
        </div>
      </div>

      {/* Progress toward mastery */}
      {progress.status !== 'mastered' && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress to mastery</span>
            <span>{progress.exposures}/4 exposures</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all ${
                progress.exposures >= 4 && successRate >= 60 && avgConfidence >= 55
                  ? 'bg-green-500'
                  : progress.exposures >= 3
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, (progress.exposures / 4) * 100)}%` }}
            />
          </div>

          {/* Requirements checklist */}
          <div className="mt-2 space-y-1 text-xs">
            <div className={`flex items-center space-x-1 ${progress.exposures >= 4 ? 'text-green-400' : 'text-gray-400'}`}>
              <span>{progress.exposures >= 4 ? '✅' : '⏳'}</span>
              <span>4+ exposures</span>
            </div>
            <div className={`flex items-center space-x-1 ${successRate >= 60 ? 'text-green-400' : 'text-gray-400'}`}>
              <span>{successRate >= 60 ? '✅' : '⏳'}</span>
              <span>60% success rate</span>
            </div>
            <div className={`flex items-center space-x-1 ${avgConfidence >= 55 ? 'text-green-400' : 'text-gray-400'}`}>
              <span>{avgConfidence >= 55 ? '✅' : '⏳'}</span>
              <span>55% confidence</span>
            </div>
          </div>
        </div>
      )}

      {/* Mastered celebration */}
      {progress.status === 'mastered' && progress.masteredAt && (
        <div className="mt-2 p-2 bg-green-900/20 border border-green-700 rounded">
          <div className="flex items-center space-x-1 text-green-400 text-xs">
            <span>🎉</span>
            <span>Mastered on {new Date(progress.masteredAt).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Progress summary component for dashboard
export function ProgressSummary({ phrases }: { phrases: PhraseProgress[] }) {
  const statusCounts = {
    new: phrases.filter(p => p.status === 'new').length,
    familiar: phrases.filter(p => p.status === 'familiar').length,
    learning: phrases.filter(p => p.status === 'learning').length,
    mastered: phrases.filter(p => p.status === 'mastered').length
  }

  const total = phrases.length
  const masteryRate = total > 0 ? (statusCounts.mastered / total) * 100 : 0

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-semibold mb-3">Learning Progress</h3>

      {/* Overall mastery rate */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Overall Mastery</span>
          <span className="text-white font-medium">{Math.round(masteryRate)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
            style={{ width: `${masteryRate}%` }}
          />
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <div>
            <div className="text-sm font-medium text-green-400">{statusCounts.mastered}</div>
            <div className="text-xs text-gray-400">Mastered</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div>
            <div className="text-sm font-medium text-yellow-400">{statusCounts.learning}</div>
            <div className="text-xs text-gray-400">Learning</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <div>
            <div className="text-sm font-medium text-blue-400">{statusCounts.familiar}</div>
            <div className="text-xs text-gray-400">Familiar</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <div>
            <div className="text-sm font-medium text-gray-400">{statusCounts.new}</div>
            <div className="text-xs text-gray-400">New</div>
          </div>
        </div>
      </div>
    </div>
  )
}