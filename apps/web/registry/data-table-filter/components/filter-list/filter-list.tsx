'use client'

import { getColumn } from '@bazza-ui/filters'
import { useEffect, useRef, useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { useFilterContext } from '../../context'
import { FilterListItem } from './filter-list-item'

export function FilterList() {
  const { filters, columns } = useFilterContext()

  return (
    <>
      {filters.map((filter) => {
        const id = filter.columnId
        const column = getColumn(columns, id)

        // Skip if no filter value
        if (!filter.values) return null

        return (
          <FilterListItem
            key={`filter-list-item-${filter.columnId}`}
            filter={filter}
            column={column}
          >
            <FilterListItem.Subject />
            <Separator orientation="vertical" />
            <FilterListItem.Operator />
            <Separator orientation="vertical" />
            <FilterListItem.Value />
            <Separator orientation="vertical" />
            <FilterListItem.Remove />
          </FilterListItem>
        )
      })}
    </>
  )
}

export function FilterListMobileContainer({
  children,
}: {
  children: React.ReactNode
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftBlur, setShowLeftBlur] = useState(false)
  const [showRightBlur, setShowRightBlur] = useState(true)

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
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    checkScroll()
  }, [children])

  return (
    <div className="relative w-full overflow-x-hidden">
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
}
