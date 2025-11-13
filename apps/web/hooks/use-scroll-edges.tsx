/** biome-ignore-all lint/suspicious/noExplicitAny: allow */
import { useLayoutEffect, useMemo, useState } from 'react'

type EdgeState = {
  top: boolean
  bottom: boolean
  left: boolean
  right: boolean
}

export function useScrollEdges(ref?: React.RefObject<any>) {
  const [edges, setEdges] = useState<EdgeState>({
    top: true,
    bottom: true,
    left: true,
    right: true,
  })

  useLayoutEffect(() => {
    // Determine if we're tracking window or container
    const container = ref?.current
    const isWindowScroll = !container

    const checkScroll = () => {
      let scrollTop: number
      let scrollHeight: number
      let clientHeight: number
      let scrollLeft: number
      let scrollWidth: number
      let clientWidth: number

      if (isWindowScroll) {
        // Window/document scrolling
        scrollTop = window.scrollY
        // Use the larger of documentElement and body scrollHeight for more reliable detection
        scrollHeight = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
        )
        clientHeight = window.innerHeight
        scrollLeft = window.scrollX
        scrollWidth = Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
        )
        clientWidth = window.innerWidth
      } else {
        // Container scrolling
        scrollTop = container.scrollTop
        scrollHeight = container.scrollHeight
        clientHeight = container.clientHeight
        scrollLeft = container.scrollLeft
        scrollWidth = container.scrollWidth
        clientWidth = container.clientWidth
      }

      const newEdges: EdgeState = {
        top: scrollTop === 0,
        bottom: scrollHeight - scrollTop - clientHeight <= 1,
        left: scrollLeft === 0,
        right: scrollWidth - scrollLeft === clientWidth,
      }

      // Only update if any edge has changed
      setEdges((prevEdges) => {
        if (
          prevEdges.top === newEdges.top &&
          prevEdges.bottom === newEdges.bottom &&
          prevEdges.left === newEdges.left &&
          prevEdges.right === newEdges.right
        ) {
          return prevEdges // No change, return same object to prevent re-render
        }
        return newEdges
      })
    }

    // Initial check - use requestAnimationFrame to ensure DOM is settled
    if (isWindowScroll) {
      // For window scroll, delay initial check to ensure DOM is fully laid out
      requestAnimationFrame(checkScroll)
    } else {
      checkScroll()
    }

    if (isWindowScroll) {
      // Window scroll tracking
      window.addEventListener('scroll', checkScroll, { passive: true })
      window.addEventListener('resize', checkScroll, { passive: true })
      window.addEventListener('load', checkScroll, { passive: true })
      document.addEventListener('DOMContentLoaded', checkScroll, {
        passive: true,
      })

      // Observe changes to document body that might affect scrollability
      const resizeObserver = new ResizeObserver(checkScroll)
      resizeObserver.observe(document.documentElement)
      if (document.body) {
        resizeObserver.observe(document.body)
      }

      // Observe DOM mutations that might change content size
      const mutationObserver = new MutationObserver(checkScroll)
      mutationObserver.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'], // Style/class changes can affect layout
      })

      // Listen for image loads that might change page height
      const imageLoadHandler = checkScroll
      document.addEventListener('load', imageLoadHandler, true) // Use capture to catch image loads

      // Cleanup for window
      return () => {
        window.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
        window.removeEventListener('load', checkScroll)
        document.removeEventListener('DOMContentLoaded', checkScroll)
        document.removeEventListener('load', imageLoadHandler, true)
        resizeObserver.disconnect()
        mutationObserver.disconnect()
      }
    }
    // Container scroll tracking (existing logic)
    container.addEventListener('scroll', checkScroll, { passive: true })
    const parent = container.parentElement
    if (parent) {
      parent.addEventListener('scroll', checkScroll, { passive: true })
    }

    // Observers
    const resizeObserver = new ResizeObserver(checkScroll)
    resizeObserver.observe(container)
    const mutationObserver = new MutationObserver(checkScroll)
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
    })

    // Cleanup for container
    return () => {
      container.removeEventListener('scroll', checkScroll)
      if (parent) {
        parent.removeEventListener('scroll', checkScroll)
      }
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [ref])

  // Return memoized object to prevent unnecessary re-renders in consuming components
  return useMemo(
    () => ({
      left: edges.left,
      right: edges.right,
      top: edges.top,
      bottom: edges.bottom,
    }),
    [edges.left, edges.right, edges.top, edges.bottom],
  )
}
