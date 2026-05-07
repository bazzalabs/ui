'use client'

import * as React from 'react'
import { useVideoPlayer } from './use-video-player.js'

type KeyboardShortcutsScope = 'focused' | 'global' | 'none'

export function useKeyboardShortcuts(
  rootRef: React.RefObject<HTMLElement | null>,
  scope: KeyboardShortcutsScope,
) {
  const context = useVideoPlayer()

  // Use ref to get fresh values in event handler without re-subscribing
  const contextRef = React.useRef(context)
  contextRef.current = context

  React.useEffect(() => {
    if (scope === 'none') return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const ctx = contextRef.current

      switch (e.key) {
        case ' ':
          e.preventDefault()
          ctx.toggle()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          ctx.toggleFullscreen()
          break
        case 'ArrowUp':
          e.preventDefault()
          ctx.setVolume(Math.min(ctx.volume + 0.1, 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          ctx.setVolume(Math.max(ctx.volume - 0.1, 0))
          break
        case 'ArrowRight':
          e.preventDefault()
          ctx.seek(Math.min(ctx.currentTime + 5, ctx.duration))
          break
        case 'ArrowLeft':
          e.preventDefault()
          ctx.seek(Math.max(ctx.currentTime - 5, 0))
          break
        default:
          return
      }

      ctx.resetIdle()
    }

    if (scope === 'global') {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }

    // 'focused' scope - attach to root element
    const root = rootRef.current
    if (!root) return

    root.addEventListener('keydown', handleKeyDown)
    return () => root.removeEventListener('keydown', handleKeyDown)
  }, [scope, rootRef])
}
