'use client'

import type { TOCItemType } from 'fumadocs-core/toc'
import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { cn } from '@/lib/cn'

// ---------------------------------------------------------------------------
// Convention: headings prefixed with `> ` in markdown are collapsible.
//
//   ## > API Reference      ← collapsed by default in the TOC
//   ## Installation          ← always expanded (normal heading)
//
// The `> ` prefix is stripped from rendered headings by the rehype plugin
// (rehype-collapsible-headings) and from heading MDX components. The TOC
// items retain the prefix so this component can detect collapsible sections.
// ---------------------------------------------------------------------------

const COLLAPSIBLE_PREFIX = '> '

// -- Helpers ----------------------------------------------------------------

/** Recursively extract the plain-text content from a ReactNode. */
function getTextContent(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getTextContent).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return getTextContent(
      (node as React.ReactElement<{ children?: ReactNode }>).props.children,
    )
  }
  return ''
}

/**
 * Check whether a TOC title starts with the collapsible prefix and return a
 * cleaned version of the title with the prefix stripped.
 */
function parseCollapsible(title: ReactNode): {
  collapsible: boolean
  cleanTitle: ReactNode
} {
  const text = getTextContent(title)
  if (!text.startsWith(COLLAPSIBLE_PREFIX)) {
    return { collapsible: false, cleanTitle: title }
  }

  // For plain string titles we can strip directly.
  if (typeof title === 'string') {
    return {
      collapsible: true,
      cleanTitle: title.slice(COLLAPSIBLE_PREFIX.length),
    }
  }

  // For React element titles the rehype plugin should have already stripped
  // the prefix from the rendered text, so we just mark it as collapsible.
  return { collapsible: true, cleanTitle: title }
}

// -- Section tree -----------------------------------------------------------

interface TOCChild {
  item: TOCItemType
  cleanTitle: ReactNode
}

interface TOCSection {
  /** The section heading (depth 2). */
  item: TOCItemType
  /** Display title with the collapsible prefix stripped. */
  cleanTitle: ReactNode
  /** Child items nested under this heading (depth 3+). */
  children: TOCChild[]
  /** Whether this section is collapsible (starts collapsed). */
  collapsible: boolean
}

/**
 * Convert the flat `TOCItemType[]` into a list of sections.
 *
 * Each depth-2 heading starts a new section. Deeper headings are grouped
 * as children of the most recent section. Items that appear before any
 * depth-2 heading are treated as standalone (non-collapsible) sections.
 */
function buildSections(items: TOCItemType[]): TOCSection[] {
  const sections: TOCSection[] = []

  for (const item of items) {
    const { collapsible, cleanTitle } = parseCollapsible(item.title)

    if (item.depth === 2) {
      sections.push({
        item,
        cleanTitle,
        children: [],
        collapsible,
      })
    } else {
      const lastSection = sections.at(-1)

      if (lastSection) {
        lastSection.children.push({ item, cleanTitle })
      } else {
        // Orphan item before any h2 — render as a standalone entry.
        sections.push({
          item,
          cleanTitle,
          children: [],
          collapsible: false,
        })
      }
    }
  }

  return sections
}

// -- Components -------------------------------------------------------------

function CollapsibleSection({ section }: { section: TOCSection }) {
  const [isOpen, setIsOpen] = useState(!section.collapsible)

  // Auto-expand when the URL hash matches this section or any of its children.
  useEffect(() => {
    if (!section.collapsible) return

    const checkHash = () => {
      const hash = window.location.hash
      if (!hash) return

      const matchesSelf = section.item.url === hash
      const matchesChild = section.children.some((c) => c.item.url === hash)

      if (matchesSelf || matchesChild) {
        setIsOpen(true)
      }
    }

    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [section])

  const hasChildren = section.children.length > 0

  return (
    <div>
      {/* Section heading */}
      <div
        className="flex items-center"
        style={{
          paddingInlineStart: 12 * Math.max(section.item.depth - 1, 0),
        }}
      >
        {section.collapsible ? (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="-ml-6 mr-0.5 p-0.5 hover:text-primary cursor-pointer group"
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Collapse section' : 'Expand section'}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              role="img"
              focusable="false"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              className="group-aria-expanded:rotate-90"
            >
              <path
                d="M7.00194 10.6239C6.66861 10.8183 6.25 10.5779 6.25 10.192V5.80802C6.25 5.42212 6.66861 5.18169 7.00194 5.37613L10.7596 7.56811C11.0904 7.76105 11.0904 8.23895 10.7596 8.43189L7.00194 10.6239Z"
                fill="currentColor"
              />
            </svg>
          </button>
        ) : null}

        <Link
          href={section.item.url}
          className="py-1.5 hover:text-primary flex-1"
        >
          {section.cleanTitle}
        </Link>
      </div>

      {/* Children (collapsible when section is marked) */}
      {hasChildren && (
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-200 ease-out',
            section.collapsible && !isOpen
              ? 'grid-rows-[0fr]'
              : 'grid-rows-[1fr]',
          )}
        >
          <div className="overflow-hidden">
            {section.children.map((child) => (
              <Link
                key={child.item.url}
                href={child.item.url}
                className="block py-1.5 hover:text-primary"
                style={{
                  paddingInlineStart: 12 * Math.max(child.item.depth - 1, 0),
                }}
              >
                {child.cleanTitle}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// -- Public -----------------------------------------------------------------

export interface InlineTocProps extends ComponentProps<'div'> {
  items: TOCItemType[]
}

export function InlineTOC({ items, ...props }: InlineTocProps) {
  const sections = useMemo(() => buildSections(items), [items])

  return (
    <div
      className="flex flex-col p-4 pt-0 text-sm text-muted-foreground mt-22"
      {...props}
    >
      {sections.map((section) => (
        <CollapsibleSection key={section.item.url} section={section} />
      ))}
    </div>
  )
}
