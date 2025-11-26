'use client'

import {
  type ComponentPropsWithoutRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { cn } from '@/lib/utils'

export interface FilterListMobileContainerProps
  extends ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode
}

/**
 * A scrollable container for filter blocks on mobile devices.
 * Renders a `<div>` element with horizontal scroll and blur effects.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
const FilterListMobileContainer = forwardRef<
  HTMLDivElement,
  FilterListMobileContainerProps
>(({ children, className, ...props }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftBlur, setShowLeftBlur] = useState(false)
  const [showRightBlur, setShowRightBlur] = useState(true)

  useImperativeHandle(ref, () => containerRef.current!)

  // Check if there's content to scroll and update blur states
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current

      // Show left blur if scrolled to the right
      setShowLeftBlur(scrollLeft > 0)

      // Show right blur if there's more content to scroll to the right
      // Add a small buffer (1px) to account for rounding errors
      setShowRightBlur(scrollLeft + clientWidth < scrollWidth - 1)
    }
  }

  // Set up ResizeObserver to monitor container size
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        checkScroll()
      })
      resizeObserver.observe(scrollContainerRef.current)
      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [])

  // Update blur states when children change
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-check on children change
  useEffect(() => {
    checkScroll()
  }, [children])

  return (
    <div
      ref={containerRef}
      data-slot="filter-list-mobile-container"
      className={cn('relative w-full overflow-x-hidden', className)}
      {...props}
    >
      {/* Left blur effect */}
      {showLeftBlur && (
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent animate-in fade-in-0" />
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-scroll no-scrollbar"
        onScroll={checkScroll}
      >
        {children}
      </div>

      {/* Right blur effect */}
      {showRightBlur && (
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent animate-in fade-in-0 " />
      )}
    </div>
  )
})

FilterListMobileContainer.displayName = 'FilterListMobileContainer'

export { FilterListMobileContainer }

export namespace FilterListMobileContainer {
  export type Props = FilterListMobileContainerProps
}
