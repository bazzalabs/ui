'use client'

import { useEffect, useState } from 'react'
import { TextMorph } from 'torph/react'

const DEFAULT_ROTATION_DELAY = 2600
const DEFAULT_INITIAL_DELAY = 3000

type RotatingTextMorphProps = {
  strings: string[]
  delay?: number
  initialDelay?: number
  className?: string
}

export function RotatingTextMorph({
  strings,
  delay = DEFAULT_ROTATION_DELAY,
  initialDelay = DEFAULT_INITIAL_DELAY,
  className,
}: RotatingTextMorphProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (strings.length <= 1) {
      return
    }

    const normalizedDelay = Math.max(16, delay)
    const normalizedInitialDelay = Math.max(0, initialDelay)
    let intervalId: ReturnType<typeof setInterval> | undefined

    const timeoutId = setTimeout(() => {
      setCurrentIndex((index) => (index + 1) % strings.length)

      intervalId = setInterval(() => {
        setCurrentIndex((index) => (index + 1) % strings.length)
      }, normalizedDelay)
    }, normalizedInitialDelay)

    return () => {
      clearTimeout(timeoutId)

      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [delay, initialDelay, strings])

  useEffect(() => {
    if (currentIndex >= strings.length) {
      setCurrentIndex(0)
    }
  }, [currentIndex, strings.length])

  if (strings.length === 0) {
    return null
  }

  const currentText = strings[currentIndex] ?? strings[0] ?? ''

  return <TextMorph className={className}>{currentText}</TextMorph>
}
