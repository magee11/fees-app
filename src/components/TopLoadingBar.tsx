import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useDelayedFlag } from '../hooks/useDelayedFlag';

/**
 * Slim indeterminate progress bar pinned to the top of the viewport, visible
 * whenever any react-query request is in flight — covers every screen uniformly
 * without each page having to wire its own indicator. Only appears after a short
 * delay so quick, warm requests don't cause a flash.
 */
export function TopLoadingBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = fetching + mutating > 0;
  const show = useDelayedFlag(active, 400);

  if (!show) return null;

  return (
    <div className="top-loading-bar" role="progressbar" aria-label="Loading">
      <div className="top-loading-bar-fill" />
    </div>
  );
}
