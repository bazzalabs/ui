'use client'

import type { TOCItemType } from 'fumadocs-core/toc'
import { useRef } from 'react'
import { FadeContainer } from '@/components/fade-container'
import { InlineTOC } from '@/components/inline-toc'

export function InlineTOCContainer({ items }: { items: TOCItemType[] }) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <FadeContainer
      scrollContainerRef={ref}
      resizeMeasurementDelay={100}
      background="var(--color-background)"
    >
      <div ref={ref} className="overflow-y-scroll max-h-[95svh] pb-32">
        <InlineTOC items={items} />
      </div>
    </FadeContainer>
  )
}
