'use client'

import * as React from 'react'
import { useGroupContext } from '../../../listbox/index.js'

export interface GroupDescription {
  /**
   * The id the group's options point `aria-describedby` at: the group's own
   * description node, else the nearest labelled ancestor group's. Unset when
   * neither has a label.
   */
  descriptionId: string | undefined
  /** Stable setter `GroupLabel` calls with its text. */
  registerLabel: (text: string) => void
  /** The group's hidden description node, or `null` while it has no label. */
  element: React.ReactNode
}

/**
 * Names a group the way ADR-0005 does: one always-mounted `hidden` node holds
 * the group's name, and every option in the group points `aria-describedby`
 * at it (through `GroupContext.descriptionId`). An element referenced by
 * `aria-describedby` describes even while hidden, and hiding it keeps its
 * text from reading as stray content inside the listbox.
 *
 * The name is `label` when given, else the last text the group's `GroupLabel`
 * registered. The node belongs to the group, not to its label, so it stays
 * when the label row unmounts in a windowed list. A group with no name of its
 * own passes on its nearest labelled ancestor's description, so an unlabelled
 * radio group inside a labelled group keeps its options described.
 */
export function useGroupDescription(label?: string): GroupDescription {
  const id = React.useId()
  const parentDescriptionId = useGroupContext()?.descriptionId
  const [registeredLabel, setRegisteredLabel] = React.useState('')
  const text = label || registeredLabel
  const ownDescriptionId = text ? `${id}-description` : undefined

  const element = ownDescriptionId ? (
    <span id={ownDescriptionId} hidden>
      {text}
    </span>
  ) : null

  return {
    descriptionId: ownDescriptionId ?? parentDescriptionId,
    registerLabel: setRegisteredLabel,
    element,
  }
}
