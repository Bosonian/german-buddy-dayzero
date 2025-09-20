const CACHE_NAME = 'gbuddy-cache-v1';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/offline',
];
const RUNTIME_CACHE = 'gbuddy-runtime-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => {
      if (![CACHE_NAME, RUNTIME_CACHE].includes(k)) return caches.delete(k);
    }))).then(() => self.clients.claim())
  );
});

// Helper: detect navigation requests
const isNavigation = (request) => request.mode === 'navigate';

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Navigation requests: try network, fall back to cache, then offline page
  if (isNavigation(request)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/offline');
        })
    );
    return;
  }

  const url = new URL(request.url);

  // Cache-first for our static assets
  const isStatic = url.origin === self.location.origin && (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/icon-') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.svg')
  );

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return res;
      }))
    );
    return;
  }

  // Network-first for JSON data
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        return res;
      }).catch(() => caches.match(request))
    );
    return;
  }
});

// Notification handling for German Buddy
self.addEventListener('notificationclick', (event) => {
  const { action, notification } = event

  event.notification.close()

  if (action === 'practice') {
    // Open the app and start practicing
    event.waitUntil(
      self.clients.openWindow('/?notification=practice')
    )
  } else if (action === 'later') {
    // Schedule reminder for 1 hour later
    setTimeout(() => {
      self.registration.showNotification('German Buddy - Reminder', {
        body: '⏰ Quick reminder: Time for your German practice!',
        icon: '/icon-192x192.svg',
        badge: '/icon-192x192.svg',
        tag: 'later-reminder'
      })
    }, 60 * 60 * 1000) // 1 hour
  } else {
    // Default: just open the app
    event.waitUntil(
      self.clients.openWindow('/')
    )
  }
})

// Handle background sync for scheduling notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'schedule-notification') {
    event.waitUntil(scheduleNextNotification())
  }
})

// Schedule daily notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { time } = event.data
    scheduleNotificationAtTime(time)
  }

  // Handle notification permission changes from the app
  if (event.data && event.data.type === 'NOTIFICATION_PERMISSION_GRANTED') {
    const { time } = event.data
    if (time) {
      scheduleNotificationAtTime(time)
    }
  }

  // Handle updating notification time
  if (event.data && event.data.type === 'UPDATE_NOTIFICATION_TIME') {
    const { time } = event.data
    scheduleNotificationAtTime(time)
  }
})

function scheduleNotificationAtTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number)
  const now = new Date()
  const scheduledTime = new Date()
  scheduledTime.setHours(hours, minutes, 0, 0)

  // If time has passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1)
  }

  const timeUntilNotification = scheduledTime.getTime() - now.getTime()

  setTimeout(() => {
    const messages = [
      '🇩🇪 Time for your daily German practice!',
      '📚 Ready to learn 5 new German phrases?',
      '🎯 Your German journey awaits - let\'s practice!',
      '⚡ Quick 10-minute German session?',
      '🚀 Keep your German streak going!',
    ]

    const randomMessage = messages[Math.floor(Math.random() * messages.length)]

    self.registration.showNotification('German Buddy', {
      body: randomMessage,
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      tag: 'daily-reminder',
      actions: [
        {
          action: 'practice',
          title: 'Start Learning'
        },
        {
          action: 'later',
          title: 'Remind Later'
        }
      ],
      requireInteraction: true, // Keep notification until user interacts
      vibrate: [200, 100, 200] // Vibration pattern for mobile
    })

    // Schedule next day
    scheduleNotificationAtTime(timeString)
  }, timeUntilNotification)
}

