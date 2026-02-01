import { useEffect, useState } from 'react';

export const getScrolledState = (scrollY: number, threshold = 10) => scrollY > threshold;

interface ScrollDetectionOptions {
  threshold?: number;
  debounceMs?: number;
}

export function useScrollDetection(options: ScrollDetectionOptions = {}) {
  const { threshold = 10, debounceMs = 60 } = options;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let timeoutId: number | undefined;

    const update = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        setScrolled(getScrolledState(window.scrollY, threshold));
      }, debounceMs);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener('scroll', update);
    };
  }, [threshold, debounceMs]);

  return scrolled;
}
