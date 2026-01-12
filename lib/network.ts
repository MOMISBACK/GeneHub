import { useEffect, useState } from 'react';

type NetInfoLike = {
  addEventListener: (listener: (state: any) => void) => () => void;
  fetch: () => Promise<any>;
};

function getNetInfo(): NetInfoLike | null {
  try {
    // Lazy-load to avoid crashing when the native module isn't present
    // (e.g. wrong runtime / dev client missing the module).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-community/netinfo');
    return (mod?.default ?? mod) as NetInfoLike;
  } catch {
    return null;
  }
}

/**
 * Best-effort online state.
 * - `isInternetReachable` is the preferred signal when available.
 * - Falls back to `isConnected`.
 */
export function useIsOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const NetInfo = getNetInfo();
    if (!NetInfo) {
      // Best-effort fallback: assume online if we can't observe connectivity.
      // This avoids hard-crashing the app on runtimes without NetInfo.
      return;
    }

    const unsub = NetInfo.addEventListener((state) => {
      const reachable = state.isInternetReachable;
      if (typeof reachable === 'boolean') {
        setOnline(reachable);
        return;
      }
      setOnline(!!state.isConnected);
    });

    NetInfo.fetch()
      .then((state) => {
        const reachable = state.isInternetReachable;
        if (typeof reachable === 'boolean') {
          setOnline(reachable);
          return;
        }
        setOnline(!!state.isConnected);
      })
      .catch(() => {
        // Keep previous value.
      });

    return unsub;
  }, []);

  return online;
}
