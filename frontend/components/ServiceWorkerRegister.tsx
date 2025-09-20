'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const register = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
          // Optional: listen for updates
          reg.addEventListener?.('updatefound', () => {})
        } catch (e) {
          // no-op
        }
      }
      register()
    }
  }, [])

  return null
}

