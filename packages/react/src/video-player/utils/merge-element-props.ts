import { makeEventPreventable, mergeProps } from '@base-ui/react/merge-props'
import type * as React from 'react'

type ElementType = React.ElementType
type ElementProps<T extends ElementType> = React.ComponentPropsWithRef<T>

export function mergeElementProps<
  T extends ElementType,
  InternalProps extends Record<string, unknown> = ElementProps<T>,
  ExternalProps extends Partial<ElementProps<T>> = Partial<ElementProps<T>>,
>(internalProps: InternalProps, externalProps: ExternalProps) {
  return mergeProps<T>(
    internalProps as ElementProps<T>,
    wrapEventHandlers<T>(externalProps) as ElementProps<T>,
  ) as InternalProps & ExternalProps
}

function wrapEventHandlers<T extends ElementType>(
  props: Partial<ElementProps<T>>,
) {
  const wrappedProps = { ...props } as Record<string, unknown>

  for (const propName in wrappedProps) {
    const propValue = wrappedProps[propName]
    if (isEventHandler(propName, propValue)) {
      wrappedProps[propName] = (
        event: React.SyntheticEvent,
        ...args: unknown[]
      ) => {
        makeEventPreventable(
          event as Parameters<typeof makeEventPreventable>[0],
        )
        return propValue(event, ...args)
      }
    }
  }

  return wrappedProps as Partial<ElementProps<T>>
}

function isEventHandler(
  key: string,
  value: unknown,
): value is (event: React.SyntheticEvent, ...args: unknown[]) => unknown {
  return (
    key.charCodeAt(0) === 111 &&
    key.charCodeAt(1) === 110 &&
    key.charCodeAt(2) >= 65 &&
    key.charCodeAt(2) <= 90 &&
    typeof value === 'function'
  )
}
