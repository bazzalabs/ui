import * as React from 'react'

type UseControllableStateParams<T> = {
  prop?: T
  defaultProp?: T
  onChange?: (value: T) => void
}

type SetStateFn<T> = (prevState?: T) => T

/**
 * A custom hook that manages controllable and uncontrollable state.
 * Adapted from Radix UI's useControllableState.
 */
export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>): [
  T | undefined,
  (value: T | SetStateFn<T>) => void,
] {
  const [uncontrolledProp, setUncontrolledProp] = useUncontrolledState({
    defaultProp,
    onChange,
  })
  const isControlled = prop !== undefined
  const value = isControlled ? prop : uncontrolledProp

  const handleChange = React.useCallback(
    (nextValue: T | SetStateFn<T>) => {
      if (isControlled) {
        const setter = nextValue as SetStateFn<T>
        const newValue =
          typeof nextValue === 'function' ? setter(prop) : nextValue
        if (newValue !== prop) {
          onChange?.(newValue)
        }
      } else {
        setUncontrolledProp(nextValue)
      }
    },
    [isControlled, prop, onChange, setUncontrolledProp],
  )

  return [value, handleChange]
}

function useUncontrolledState<T>({
  defaultProp,
  onChange,
}: Omit<UseControllableStateParams<T>, 'prop'>): [
  T | undefined,
  React.Dispatch<React.SetStateAction<T | undefined>>,
] {
  const uncontrolledState = React.useState<T | undefined>(defaultProp)
  const [value] = uncontrolledState
  const prevValueRef = React.useRef(value)
  const handleChange = useCallbackRef(onChange)

  React.useEffect(() => {
    if (prevValueRef.current !== value) {
      handleChange(value as T)
      prevValueRef.current = value
    }
  }, [value, handleChange])

  return uncontrolledState
}

function useCallbackRef<T extends (...args: never[]) => unknown>(
  callback: T | undefined,
): T {
  const callbackRef = React.useRef(callback)

  React.useEffect(() => {
    callbackRef.current = callback
  })

  return React.useMemo(
    () => ((...args) => callbackRef.current?.(...args)) as T,
    [],
  )
}
