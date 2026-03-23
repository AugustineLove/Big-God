import { useState, useEffect, useCallback } from 'react';

/**
 * useSpotlight
 *
 * Returns `{ isOpen, open, close, toggle }`.
 * Registers a global `Ctrl+G` (or `Cmd+G` on Mac) keydown listener
 * that toggles the spotlight. Call `close()` from the SpotlightSearch
 * component when the user dismisses it.
 *
 * Usage inside DashboardLayout:
 *
 *   const spotlight = useSpotlight();
 *   ...
 *   <SpotlightSearch isOpen={spotlight.isOpen} onClose={spotlight.close} />
 */
export const useSpotlight = () => {
  const [isOpen, setIsOpen] = useState(false);
  console.log(`Spotlight is open: ${isOpen}`)
  const open   = useCallback(() => setIsOpen(true),  []);
  const close  = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(p => !p), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+G or Cmd+G — prevent browser "find next" behaviour
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  return { isOpen, open, close, toggle };
};
