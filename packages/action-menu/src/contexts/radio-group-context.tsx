import * as React from 'react'
import type { RadioGroupContextValue } from '../types.js'

/** Radio group context (for managing radio item selection within a group) */
const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null,
)

export const useRadioGroup = () => React.useContext(RadioGroupContext)

export { RadioGroupContext }
