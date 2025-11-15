'use client'

import { getColumn } from '@bazza-ui/filters'
import {
  type ComponentPropsWithoutRef,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useFilterContext } from '../../context'
import { FilterBlock } from './filter-block'

interface FilterListProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {}

export function FilterList({ className, ...props }: FilterListProps = {}) {
  const { filters, columns } = useFilterContext()

  return (
    <div
      data-slot="filter-list"
      className={cn('contents', className)}
      {...props}
    >
      {filters.map((filter) => {
        const id = filter.columnId
        const column = getColumn(columns, id)

        // Skip if no filter value
        if (!filter.values) return null

        return (
          <FilterBlock
            key={`filter-block-${filter.columnId}`}
            filter={filter}
            column={column}
          >
            <FilterBlock.Subject />
            <Separator orientation="vertical" />
            <FilterBlock.Operator />
            <Separator orientation="vertical" />
            <FilterBlock.Value />
            <Separator orientation="vertical" />
            <FilterBlock.Remove />
          </FilterBlock>
        )
      })}
    </div>
  )
}

interface FilterListMobileContainerProps
  extends ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode
}

export function FilterListMobileContainer({
  children,
  className,
  ...props
}: FilterListMobileContainerProps) {
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
    <div
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
}
