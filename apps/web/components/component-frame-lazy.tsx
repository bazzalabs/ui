'use client'

import { useEffect, useRef, useState } from 'react'

export const ComponentFrameLazy = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true)
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before visible
      },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  return <div ref={ref}>{isVisible ? children : null}</div>
}
