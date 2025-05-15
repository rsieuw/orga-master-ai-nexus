import * as React from "react"

/**
 * Breakpoint in pixels used to determine if the screen size is considered mobile.
 * Devices with a width less than this value are classified as mobile.
 * @constant
 * @type {number}
 */
const MOBILE_BREAKPOINT = 768

/**
 * Custom React hook to determine if the current viewport width is considered mobile.
 *
 * It uses a media query to listen for changes in screen width and updates its state accordingly.
 * The initial state is `undefined` and will be updated to `true` or `false` after the first render.
 *
 * @returns {boolean} `true` if the viewport width is less than `MOBILE_BREAKPOINT`, `false` otherwise.
 *                    Returns `false` during server-side rendering or before the first client-side render.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = globalThis.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(globalThis.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(globalThis.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
