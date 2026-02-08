import { useState, useEffect } from "react";
import { useThemeStore, useSidebar } from "@/store";

export function useLayoutReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function check() {
      if (
        useThemeStore.persist.hasHydrated() &&
        useSidebar.persist.hasHydrated()
      ) {
        setReady(true);
      }
    }

    // Check immediately (may already be hydrated)
    check();

    // Subscribe to finish hydration events
    const unsub1 = useThemeStore.persist.onFinishHydration(() => check());
    const unsub2 = useSidebar.persist.onFinishHydration(() => check());

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  return ready;
}
