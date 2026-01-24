Implemented a reusable timeline visualization with responsive layout, status-aware markers, arrow-based reordering, and keyboard support. The component lives in `src/components/questions/TimelineView.tsx`, uses Phosphor timeline icons, and applies dark mode styles plus ARIA labels for screen readers.

No tests were run.

Next steps you might want:
1) Manually verify the timeline with 4 items (with years) and 5 items (without years) in desktop + mobile viewports.
2) Check keyboard reordering with arrow keys and confirm screen reader announcements.
