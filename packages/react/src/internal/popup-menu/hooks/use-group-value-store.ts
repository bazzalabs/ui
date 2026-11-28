'use client'

import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect'
import { useRefWithInit } from '@base-ui/utils/useRefWithInit'

/**
 * A selection group provider's store (a `GroupValueStore`), made once by
 * `create` with the provider's first props; its `value` prop syncs into it
 * from a layout effect.
 */
export function useGroupValueStore<
  Value,
  GroupStore extends { control(value: Value | undefined): void },
>(value: Value | undefined, create: () => GroupStore): GroupStore {
  const store = useRefWithInit(create).current
  useIsoLayoutEffect(() => {
    store.control(value)
  }, [store, value])
  return store
}
