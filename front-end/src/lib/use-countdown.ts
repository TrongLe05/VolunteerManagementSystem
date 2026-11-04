import * as React from "react"

/** Counts down from `seconds` to 0 once per second; `restart()` begins again. Used for resend cool-downs and session warnings. */
export function useCountdown(seconds: number, autoStart = true) {
  const [left, setLeft] = React.useState(autoStart ? seconds : 0)
  const [epoch, setEpoch] = React.useState(0)
  const running = left > 0
  React.useEffect(() => {
    if (!running) return
    const t = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000)
    return () => clearInterval(t)
  }, [running, epoch])
  const restart = React.useCallback((s = seconds) => { setLeft(s); setEpoch((e) => e + 1) }, [seconds])
  return [left, restart] as const
}
