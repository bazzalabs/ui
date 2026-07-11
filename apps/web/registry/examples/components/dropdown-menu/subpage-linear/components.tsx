'use client'

import type * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export const LABEL_STYLES_BG = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
  neutral: 'bg-neutral-500',
} as const

export type TW_COLOR = keyof typeof LABEL_STYLES_BG

export function LabelDot({ color }: { color: string }) {
  return (
    <div
      className={cn(
        'rounded-full size-2.5',
        LABEL_STYLES_BG[color as TW_COLOR] ?? 'bg-neutral-500',
      )}
    />
  )
}

export function MenuLabel({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu.Icon>{icon}</DropdownMenu.Icon>
      <span className="truncate">{label}</span>
    </div>
  )
}

export function AssigneeAvatar({
  name,
  username,
}: {
  name: string
  username: string
}) {
  return (
    <Avatar className="size-4">
      <AvatarImage
        src={`https://github.com/${username}.png`}
        alt={`@${username}`}
      />
      <AvatarFallback className="text-[8px]">
        {name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  )
}

export const FilterIcon = () => (
  <svg
    className="fill-muted-foreground size-4"
    viewBox="0 0 16 16"
    role="img"
    focusable="false"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.25 3a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5h12.5ZM4 8a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 4 8Zm2.75 3.5a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5h-2.5Z"
    />
  </svg>
)
