'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { KbdKey } from '../key/key.js'
import { getChordLabels, parseKeybinding } from '../utils/parse-keybinding.js'
import { usePlatform } from '../utils/platform.js'
import { KbdRootDataAttributes } from './root.data-attrs.js'

type Platform = 'apple' | 'other'

export interface KbdRootState extends Record<string, unknown> {
  platform: Platform
}

export interface KbdRootProps
  extends Omit<ComponentProps<'span', KbdRoot.State>, 'children'> {
  keys: string
  platform?: Platform
  separator?: React.ReactNode
}

const stateAttributesMapping = {
  platform: (value: unknown): Record<string, string> | null => ({
    [KbdRootDataAttributes.platform]: String(value),
  }),
}

export const KbdRoot = React.forwardRef<HTMLSpanElement, KbdRoot.Props>(
  function KbdRoot(props, forwardedRef) {
    const {
      keys,
      platform: platformProp,
      separator = 'then',
      render,
      className,
      style,
      ...rest
    } = props

    const platform = usePlatform(platformProp)
    const keybinding = React.useMemo(() => parseKeybinding(keys), [keys])

    const state: KbdRoot.State = React.useMemo(() => ({ platform }), [platform])

    const renderedChildren = React.useMemo(() => {
      const entries: React.ReactNode[] = []
      // Content-derived keys: chords are fully derived from the `keys` string,
      // so a chord's joined labels (disambiguated by occurrence count for
      // repeated chords like "g g") form a stable identity.
      const seen = new Map<string, number>()

      for (const chord of keybinding.chords) {
        const labels = getChordLabels(chord, platform)
        const chordId = labels.join('+')
        const occurrence = (seen.get(chordId) ?? 0) + 1
        seen.set(chordId, occurrence)
        const prefix = `${chordId}#${occurrence}`

        if (entries.length > 0) {
          entries.push(
            <span key={`${prefix}-separator`} data-kbd-separator="">
              {separator}
            </span>,
          )
        }
        for (const label of labels) {
          entries.push(<KbdKey key={`${prefix}-${label}`}>{label}</KbdKey>)
        }
      }

      return entries
    }, [keybinding, platform, separator])

    return useRender({
      render,
      ref: forwardedRef,
      state,
      stateAttributesMapping,
      props: {
        ...rest,
        [KbdRootDataAttributes.root]: '',
        className,
        style,
        children: renderedChildren,
      },
      defaultTagName: 'span',
    })
  },
)

export namespace KbdRoot {
  export type State = KbdRootState
  export interface Props extends KbdRootProps {}
}
