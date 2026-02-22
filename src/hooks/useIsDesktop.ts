"use client";

import { useState, useEffect } from 'react';

const MD_BREAKPOINT = 768;

/**
 * A hook to determine if the current viewport is wider than the 'md' breakpoint (768px).
 * It safely handles server-side rendering by defaulting to `false` (mobile).
 * @returns {boolean} `true` if the viewport is desktop-sized, `false` otherwise.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`);
    
    const handleResize = () => {
      setIsDesktop(mediaQuery.matches);
    };

    // Set the initial state
    handleResize();

    // Add event listener for window resize
    mediaQuery.addEventListener('change', handleResize);

    // Cleanup event listener on component unmount
    return () => {
      mediaQuery.removeEventListener('change', handleResize);
    };
  }, []);

  return isDesktop;
}
