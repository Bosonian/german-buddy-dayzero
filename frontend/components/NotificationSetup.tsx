'use client'

import { useState, useEffect } from 'react'

interface NotificationSetupProps {
  onPermissionChanged?: (granted: boolean) => void
}

export default function NotificationSetup({ onPermissionChanged }: NotificationSetupProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [reminderTime, setReminderTime] = useState('19:00') // 7 PM default

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window && 'serviceWorker' in navigator)

    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!isSupported) return

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      onPermissionChanged?.(permission === 'granted')

      if (permission === 'granted') {
        // Schedule daily notification
        scheduleDailyNotification()

        // Communicate with service worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'NOTIFICATION_PERMISSION_GRANTED',
            time: reminderTime
          })
        }

        // Show immediate test notification
        new Notification('German Buddy', {
          body: '🎯 Notifications enabled! We\'ll remind you to practice German daily.',
          icon: '/icon-192x192.svg',
          badge: '/icon-192x192.svg',
          tag: 'test-notification'
        })
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    }
  }

  const scheduleDailyNotification = () => {
    if (permission !== 'granted') return

    // Store reminder time in localStorage
    localStorage.setItem('gb_reminder_time', reminderTime)

    // Calculate next notification time
    scheduleNextNotification()

    // Also communicate with service worker if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_NOTIFICATION_TIME',
        time: reminderTime
      })
    }
  }

  const scheduleNextNotification = () => {
    // Clear existing timeout
    const existingTimeout = localStorage.getItem('gb_notification_timeout')
    if (existingTimeout) {
      clearTimeout(Number(existingTimeout))
    }

    const [hours, minutes] = reminderTime.split(':').map(Number)
    const now = new Date()
    const scheduledTime = new Date()
    scheduledTime.setHours(hours, minutes, 0, 0)

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime()

    const timeoutId = setTimeout(() => {
      sendDailyReminder()
      // Schedule next day
      scheduleNextNotification()
    }, timeUntilNotification)

    localStorage.setItem('gb_notification_timeout', timeoutId.toString())
  }

  const sendDailyReminder = () => {
    if (permission !== 'granted') return

    const lastLearningDate = localStorage.getItem('gb_last_learning_date')
    const today = new Date().toDateString()

    // Check if user already learned today
    if (lastLearningDate === today) {
      return // Don't send notification if already learned today
    }

    const messages = [
      '🇩🇪 Time for your daily German practice!',
      '📚 Ready to learn 5 new German phrases?',
      '🎯 Your German journey awaits - let\'s practice!',
      '⚡ Quick 10-minute German session?',
      '🚀 Keep your German streak going!',
    ]

    const randomMessage = messages[Math.floor(Math.random() * messages.length)]

    new Notification('German Buddy', {
      body: randomMessage,
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      tag: 'daily-reminder'
      // Note: actions are supported via service worker notifications, not direct Notification constructor
    })
  }

  const testNotification = () => {
    if (permission !== 'granted') return

    new Notification('German Buddy - Test', {
      body: '🧪 This is a test notification. Daily reminders will look like this!',
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      tag: 'test'
    })
  }

  if (!isSupported) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-yellow-400">⚠️</span>
          <h3 className="font-semibold text-yellow-300">Notifications Not Supported</h3>
        </div>
        <p className="text-sm text-yellow-200">
          Your browser doesn't support notifications. Try using Chrome, Firefox, or Safari for the best experience.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🔔</span>
        <h3 className="text-lg font-semibold">Daily Learning Reminders</h3>
      </div>

      <p className="text-gray-300 mb-4">
        Get daily notifications to maintain your German learning streak!
      </p>

      {permission === 'default' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Reminder Time
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Choose when you'd like to be reminded to practice German
            </p>
          </div>

          <button
            onClick={requestPermission}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
          >
            🔔 Enable Daily Notifications
          </button>
        </div>
      )}

      {permission === 'granted' && (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-300">
              <span>✅</span>
              <span className="font-medium">Notifications Enabled</span>
            </div>
            <p className="text-sm text-green-200 mt-1">
              Daily reminders set for {reminderTime} each day
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Update Reminder Time
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="flex-1 p-3 bg-gray-900 border border-gray-600 rounded-lg text-white"
              />
              <button
                onClick={scheduleDailyNotification}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Update
              </button>
            </div>
          </div>

          <button
            onClick={testNotification}
            className="w-full px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
          >
            🧪 Test Notification
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-300 mb-2">
            <span>❌</span>
            <span className="font-medium">Notifications Blocked</span>
          </div>
          <p className="text-sm text-red-200 mb-3">
            You've blocked notifications. To enable them:
          </p>
          <ol className="text-xs text-red-200 space-y-1 ml-4">
            <li>1. Click the 🔒 icon in your browser's address bar</li>
            <li>2. Allow notifications for this site</li>
            <li>3. Refresh the page</li>
          </ol>
        </div>
      )}
    </div>
  )
}

// Helper function to mark learning session
export const markLearningSession = () => {
  const today = new Date().toDateString()
  localStorage.setItem('gb_last_learning_date', today)
}

// Helper function to check if user learned today
export const hasLearnedToday = (): boolean => {
  const lastLearningDate = localStorage.getItem('gb_last_learning_date')
  const today = new Date().toDateString()
  return lastLearningDate === today
}