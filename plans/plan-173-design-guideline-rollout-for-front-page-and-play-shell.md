# Plan: Design Guideline Rollout for Shared App Shell Surfaces

## Goal

Apply the stricter design contract from [DESIGN_GUIDELINES.md](/Users/mikko.makipaa/koekertaaja/DWF/DESIGN_GUIDELINES.md) to the shared app-shell surfaces so the product shell stops drifting across front page, Play, Create, Results, and Achievements pages.

## Why

The design guidance now defines a stricter system for:
- product-shell-first layout
- light vs dark mode treatment
- border-before-shadow
- one-surface-one-job
- shared CTA and card patterns

The codebase still needs a focused rollout to make those rules enforceable in the actual UI components.

## Scope

- Front page hero/header surface
- Shared primary CTA component used by front page and Play
- Front-page mode cards and section rhythm
- Play entry surfaces and related shell components
- Create page shell surfaces where the same header/card/section rules should apply
- Results and Achievements page shell surfaces where the same hierarchy and card-weight rules should apply
- Informational sections and footer treatment
- Documentation alignment where implementation guidance and design guidance must match

## Out of Scope

- Redesigning in-session play screens
- Changing question interaction flows
- New product features beyond visual/system alignment

## Rollout Order

1. Unify the primary CTA and header surface contract between front page, Play, and any matching shell headers.
2. Tighten card systems and section rhythm across front page, Play, Create, Results, and Achievements shell surfaces.
3. Reduce visual intensity in informational sections and footer so they remain secondary.
4. Validate the implementation and mirror final rules into product-level design docs if needed.

## Success Criteria

- The front page, Play, Create, Results, and Achievements pages read as one system, not isolated page-specific designs.
- Primary CTA sizing, labeling, and behavior are consistent across shared surfaces.
- Cards and shell sections use the same border, shadow, spacing, and footer action logic where they serve the same job.
- Informational sections remain calmer than action sections.
- Design documentation and implementation documentation describe the same rules.
