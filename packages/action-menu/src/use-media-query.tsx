import * as React from 'react'

export function useMediaQuery(query: string, fallback = false) {
  const [matches, setMatches] = React.useState(fallback)
  React.useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}
