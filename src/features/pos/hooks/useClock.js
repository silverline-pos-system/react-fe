import { useEffect, useState } from 'react';

/**
 * A clock that ticks once per second. Extracted from POSScreen so the header time display
 * does not need its own state + interval wiring inline.
 */
export function useClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return time;
}

export default useClock;
