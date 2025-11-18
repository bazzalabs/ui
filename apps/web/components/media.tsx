'use client'

import { useTheme } from 'next-themes'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type MediaProps = {
  src: string | { light: string; dark: string }
  href?: string
  type: 'image' | 'video'
  alt?: string
  theme?: 'light' | 'dark'
  width: number
  height: number
  className?: string
  wrapperClassName?: string
  // Optional: poster for video; if not provided, we still show the skeleton
  poster?: string
  // How the media should fit within the frame
  objectFit?: 'contain' | 'cover'
  // Whether to use aspect ratio on container (true) or let wrapperClassName control size (false)
  useAspectRatio?: boolean
  // Inset spacing (e.g., '0', '8', '2rem') - defaults to '0' (no spacing)
  inset?: string
}

export function Media({
  src,
  type,
  alt = '',
  theme = 'light',
  width,
  height,
  wrapperClassName,
  className,
  poster,
  objectFit = 'cover',
  useAspectRatio = true,
  inset = '0',
}: MediaProps) {
  const { resolvedTheme, systemTheme, theme: __theme } = useTheme()

  const resolvedSrc = useMemo(
    () =>
      typeof src === 'string'
        ? src
        : resolvedTheme === 'dark'
          ? src.dark
          : src.light,
    [src, resolvedTheme, systemTheme],
  )
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLVideoElement | HTMLImageElement | null>(null)
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined)
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined)
  const [posterSrc, setPosterSrc] = useState<string | undefined>(poster)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle image source updates (similar to video logic)
  useEffect(() => {
    if (type !== 'image') return

    // If image source changes and we've already loaded an image, update it immediately
    if (imageSrc && resolvedSrc !== imageSrc) {
      setLoaded(false)
      setImageSrc(resolvedSrc)
      return
    }

    // Otherwise, set it immediately (no lazy loading for images)
    setImageSrc(resolvedSrc)
  }, [type, resolvedSrc, imageSrc])

  // When media fires its load/ready event, flip the state
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (type === 'image') {
      const img = node as HTMLImageElement
      if (img.complete && img.naturalWidth) setLoaded(true)
    }
  }, [type, imageSrc])

  useEffect(() => {
    if (type !== 'video') return

    // If video source changes and we've already loaded a video, update it immediately
    if (videoSrc && resolvedSrc !== videoSrc) {
      setVideoSrc(resolvedSrc)
      setPosterSrc(poster)
      return
    }

    // Otherwise, wait for intersection
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVideoSrc(resolvedSrc)
          setPosterSrc(poster)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => observer.disconnect()
  }, [type, resolvedSrc, poster, videoSrc])

  const onImageLoad = () => setLoaded(true)
  const onVideoReady = () => {
    setLoaded(true)
  }

  // Use aspect-ratio to reserve space and prevent layout shift
  const ratio = `${width} / ${height}`

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-clip **:select-none', wrapperClassName)}
      style={useAspectRatio ? { aspectRatio: ratio } : undefined}
    >
      {/* Skeleton / shimmer placeholder */}
      <div
        aria-hidden
        className={cn(
          'absolute',
          // base surface that fits your theme tokens
          theme === 'light' ? 'bg-sand-3' : 'bg-sand-4',
          // shimmer
          'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.2s_infinite]',
          'before:bg-gradient-to-r before:from-transparent',
          theme === 'light'
            ? 'before:via-white/40 before:to-transparent'
            : 'before:via-white/15 before:to-transparent',
          'before:[mask-image:linear-gradient(90deg,transparent,black,transparent)]',
          // fade the placeholder out once loaded
          loaded ? 'opacity-0 transition-opacity duration-300' : 'opacity-100',
        )}
        style={{ inset }}
      />

      {/* Media element: start slightly blurred and faded until ready */}
      <div
        className={cn(
          'absolute',
          loaded
            ? 'opacity-100 filter-none'
            : 'opacity-0 blur-[2px] translate-y-[2px]',
          'transition-all duration-300 will-change-transform will-change-filter will-change-opacity',
          // theme === 'light' && 'bg-red-500',
          className,
        )}
        style={{ inset }}
      >
        {type === 'image' ? (
          // biome-ignore lint/performance/noImgElement: allowed
          <img
            ref={ref as any}
            src={imageSrc}
            alt={alt}
            loading="lazy"
            decoding="async"
            width={width}
            height={height}
            className={cn(
              'h-full w-full',
              objectFit === 'contain' ? 'object-contain' : 'object-cover',
            )}
            onLoad={onImageLoad}
          />
        ) : (
          <video
            ref={ref as any}
            src={videoSrc}
            playsInline
            loop
            autoPlay
            muted
            preload="auto"
            poster={posterSrc}
            className={cn(
              'h-full w-full',
              objectFit === 'contain' ? 'object-contain' : 'object-cover',
            )}
            onLoadedData={onVideoReady}
            onCanPlayThrough={onVideoReady}
          />
        )}
      </div>
    </div>
  )
}

/* Tailwind keyframes (add once in globals.css if not present)
@keyframes shimmer {
  100% { transform: translateX(100%); }
}
*/
