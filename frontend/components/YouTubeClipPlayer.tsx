'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void }
}

interface YouTubeClipPlayerProps {
  videoId: string
  start?: number
  end?: number
  captionsLang?: string
  phrase?: string
  title?: string
  showTitle?: boolean
}

export default function YouTubeClipPlayer({
  videoId,
  start = 0,
  end,
  captionsLang = 'de',
  phrase,
  title,
  showTitle = false
}: YouTubeClipPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<any>(null)
  const [apiReady, setApiReady] = useState<boolean>(!!window.YT)

  useEffect(() => {
    if (apiReady) return
    const scriptId = 'yt-iframe-api'
    if (document.getElementById(scriptId)) return
    const tag = document.createElement('script')
    tag.id = scriptId
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)
    // YouTube API will call this when ready
    window.onYouTubeIframeAPIReady = () => setApiReady(true)
  }, [apiReady])

  useEffect(() => {
    if (!apiReady || !containerRef.current) return

    const player = new window.YT.Player(containerRef.current, {
      height: '360',
      width: '640',
      videoId,
      playerVars: {
        start,
        end,
        autoplay: 0,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        cc_load_policy: 1,
        cc_lang_pref: captionsLang,
      },
      events: {
        onReady: (event: any) => {
          // Ensure segment is cued
          event.target.cueVideoById({ videoId, startSeconds: start, endSeconds: end })
        },
        onStateChange: (event: any) => {
          // Loop segment
          if (event.data === window.YT.PlayerState.ENDED) {
            event.target.seekTo(start, true)
            event.target.playVideo()
          }
        },
      },
    })

    playerRef.current = player
    return () => {
      try { player.destroy?.() } catch {}
    }
  }, [apiReady, videoId, start, end, captionsLang])

  // Fallback simple iframe while API loads
  const iframeSrc = `https://www.youtube.com/embed/${videoId}?start=${Math.floor(start)}${end ? `&end=${Math.floor(end)}` : ''}&autoplay=0&controls=1&cc_load_policy=1&cc_lang_pref=${captionsLang}&rel=0&modestbranding=1&playsinline=1`

  return (
    <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-800">
      <div className="relative aspect-video bg-black">
        {!apiReady && (
          <iframe
            src={iframeSrc}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
        <div ref={containerRef} className={!apiReady ? 'hidden' : 'absolute inset-0'} />
      </div>
    </div>
  )
}

