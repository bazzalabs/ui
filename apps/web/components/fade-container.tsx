/** biome-ignore-all lint/correctness/useUniqueElementIds: allowed */

'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useScrollEdges } from '@/hooks/use-scroll-edges'
import { cn } from '@/lib/utils'
import styles from './fade.module.css'

export function FadeContainer({
  children,
  scrollContainerRef,
  resizeMeasurementDelay = 0,
}: {
  children: React.ReactNode
  scrollContainerRef?: React.RefObject<HTMLElement | null>
  /**
   * Delay in milliseconds before measuring scroll edges after resize/mutation events.
   * Useful when elements inside the container are animating, to ensure measurements
   * are taken after animations complete. Defaults to 100ms.
   */
  resizeMeasurementDelay?: number
}) {
  const { top: topEdgeTouched, bottom: bottomEdgeTouched } = useScrollEdges({
    ref: scrollContainerRef,
    resizeMeasurementDelay,
  })

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      if (scrollContainerRef?.current) {
        const rect = scrollContainerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }
    updateDimensions()
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (scrollContainerRef?.current) {
      resizeObserver.observe(scrollContainerRef.current)
    }
    return () => {
      resizeObserver.disconnect()
    }
  }, [scrollContainerRef])

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full relative">
      {children}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <AnimatePresence>
          {!topEdgeTouched && (
            <Fade
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              background="var(--sidebar)"
              side="top"
              blur="4px"
              stop="25%"
              className={cn('absolute top-0 left-0 w-full h-[100px]')}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!bottomEdgeTouched && (
            <Fade
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              background="var(--sidebar)"
              side="bottom"
              blur="4px"
              stop="25%"
              className={cn('absolute bottom-0 left-0 w-full h-[100px]')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const Fade = motion.create(_Fade)

export function _Fade({
  stop,
  blur,
  side = 'top',
  className,
  background,
  style,
  ref,
  debug,
}: {
  stop?: string
  blur?: string
  side: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  background: string
  debug?: boolean
  style?: React.CSSProperties
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <div
      id="fade"
      ref={ref}
      aria-hidden
      className={cn(styles.fade, className)}
      data-side={side}
      style={
        {
          '--stop': stop,
          '--blur': blur,
          '--background': background,
          ...(debug && {
            outline: '2px solid var(--color-orange)',
          }),
          ...style,
        } as React.CSSProperties
      }
    />
  )
}
