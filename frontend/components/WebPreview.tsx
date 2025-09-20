'use client'

import { useEffect, useRef, useState } from 'react'

interface WebPreviewProps {
  url: string
  title?: string
  open: boolean
  onClose: () => void
}

export default function WebPreview({ url, title = 'Preview', open, onClose }: WebPreviewProps) {
  const [loaded, setLoaded] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    if (!open) return
    setLoaded(false)
    setBlocked(false)
    const t = setTimeout(() => {
      // If not loaded within 1500ms, assume blocked by X-Frame-Options / CSP
      if (!loaded) setBlocked(true)
    }, 1500)
    return () => clearTimeout(t)
  }, [open, url, loaded])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-[92vw] max-w-3xl h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-gray-400 truncate">{title}</div>
            <div className="text-[11px] text-gray-500 truncate">{url}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => iframeRef.current?.contentWindow?.location && (iframeRef.current.src = url)}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
            >
              Refresh
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded text-white"
            >
              Open Tab
            </a>
            <button onClick={onClose} className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded">Close</button>
          </div>
        </div>

        {/* Content */}
        <div className="w-full h-full bg-black relative">
          {!loaded && !blocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-300 text-xs">Loading preview…</p>
              </div>
            </div>
          )}

          {blocked ? (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center bg-gray-800/80 border border-gray-700 rounded-xl p-6 max-w-sm">
                <p className="text-sm text-gray-200 font-semibold mb-2">Embedding Blocked</p>
                <p className="text-xs text-gray-400 mb-4">This site prevents in-app embedding. Please open it in a new tab.</p>
                <a href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm">Open in New Tab</a>
              </div>
            </div>
          ) : null}

          {/* eslint-disable-next-line jsx-a11y/iframe-has-title */}
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full"
            onLoad={() => setLoaded(true)}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
          />
        </div>
      </div>
    </div>
  )
}

