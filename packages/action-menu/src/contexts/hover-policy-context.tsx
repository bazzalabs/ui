import * as React from 'react'
import type { HoverPolicy } from '../types.js'

const HoverPolicyCtx = React.createContext<HoverPolicy>({
  suppressHoverOpen: false,
  clearSuppression: () => {},
  aimGuardActive: false,
  guardedTriggerId: null,
  activateAimGuard: () => {},
  clearAimGuard: () => {},
  aimGuardActiveRef: React.createRef<boolean>(),
  guardedTriggerIdRef: React.createRef(),
  isGuardBlocking: () => false,
})

export const useHoverPolicy = () => React.useContext(HoverPolicyCtx)

export { HoverPolicyCtx }
