'use client';

import { useEffect } from 'react';

export const useScrollAnimation = () => {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll]'));
    if (!elements.length) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      elements.forEach((element) => {
        element.classList.add('is-visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, activeObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const target = entry.target as HTMLElement;
          target.classList.add('is-visible');
          activeObserver.unobserve(target);
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -5% 0px',
      }
    );

    elements.forEach((element) => {
      observer.observe(element);
      // Check if element is already in viewport
      const rect = element.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if (isInViewport) {
        element.classList.add('is-visible');
      }
    });

    return () => observer.disconnect();
  }, []);
};
