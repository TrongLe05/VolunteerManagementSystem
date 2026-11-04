import * as React from "react"

/** Subscribes to a CSS media query. Returns `defaultValue` on the server and before mount. */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const subscribe = React.useCallback((cb: () => void) => {
    const mql = window.matchMedia(query)
    mql.addEventListener("change", cb)
    return () => mql.removeEventListener("change", cb)
  }, [query])
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => defaultValue,
  )
}
