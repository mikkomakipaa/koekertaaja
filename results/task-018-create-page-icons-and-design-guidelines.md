Replaced the Create page’s emoji labels with Phosphor icons and aligned section labels/helper text with the existing icon style, plus removed the subject emoji from the dropdown so no emoji render on the page. Updated related create components to keep the rendered Create view emoji‑free and consistent.

Details:
- Swapped emoji headings/labels for icon+text stacks and updated mode options and list metadata icons in `src/app/create/page.tsx`.
- Converted upload and text input section labels (and the selected-files checkmark) to Phosphor icons in `src/components/create/MaterialUpload.tsx`.
- Updated the grade selector label to use a Phosphor icon in `src/components/create/GradeSelector.tsx`.

Manual testing not run.

Next steps:
1. Open the Create page and verify all sections use icons and no emojis remain.
