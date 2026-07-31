import { useEffect, useState } from 'react';

/**
 * Returns true once `active` has been continuously true for `delay` ms.
 * Used to show a "this is taking a while" hint without flashing it on fast loads —
 * important on a free-tier host where a cold start can take 30-60s but a warm
 * request returns in under a second.
 */
export function useDelayedFlag(active: boolean, delay = 4000): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [active, delay]);

  return show;
}
