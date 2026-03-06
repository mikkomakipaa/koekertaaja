# Koekertaaja

AI-assisted exam practice app for Finnish primary school students (grades 4-6), generated from and aligned with `DWF/` source documents.

## What This Project Is

Koekertaaja is a Next.js + Supabase application for creating and practicing question sets from study materials.

- Target users: students, teachers, and parents in Finnish primary education.
- Core flow: create question sets from material, share code, practice in quiz/flashcard modes.
- Learning design: gamified personal progress (points, streaks, badges) without public leaderboards.
- AI setup: provider-router architecture with Claude baseline and OpenAI option.

Primary references:
- [Core Architecture](DWF/CORE_ARCHITECTURE.md)
- [User Personas](DWF/PERSONAS.md)
- [User Journeys](DWF/USER_JOURNEYS.md)

## Documentation Map

| Document | Focus |
|---|---|
| [CORE_ARCHITECTURE.md](DWF/CORE_ARCHITECTURE.md) | Architecture decisions, AI provider strategy, generation flows |
| [DATA_MODEL.md](DWF/DATA_MODEL.md) | Data entities and relationships |
| [COMPONENTS.md](DWF/COMPONENTS.md) | UI component inventory and recent component-level updates |
| [DESIGN_GUIDELINES.md](DWF/DESIGN_GUIDELINES.md) | Visual system, layout rules, shell conventions |
| [DESIGN_IMPROVEMENTS.md](DWF/DESIGN_IMPROVEMENTS.md) | Design improvement proposals and rationale |
| [PERSONAS.md](DWF/PERSONAS.md) | Primary user personas and behavior context |
| [USER_JOURNEYS.md](DWF/USER_JOURNEYS.md) | End-to-end journey maps and friction points |
| [NFR.md](DWF/NFR.md) | Performance, reliability, security, and usability requirements |
| [TESTING_STRATEGY.md](DWF/TESTING_STRATEGY.md) | Testing goals, coverage direction, tool choices |
| [METRICS.md](DWF/METRICS.md) | Product metrics and instrumentation goals |
| [WIREFRAMES.md](DWF/WIREFRAMES.md) | Screen-level UX and interaction structure |

## Architecture At A Glance

- Frontend: Next.js App Router + React + TypeScript.
- Backend/data: Supabase (Postgres + RLS), server-authenticated mutations.
- AI generation: provider router with shared validation and normalization.
- Modes: quiz (difficulty variants) and flashcards.
- Access model: practice via shareable codes.

References:
- [Architecture ADR](DWF/CORE_ARCHITECTURE.md)
- [Data Model](DWF/DATA_MODEL.md)
- [NFR](DWF/NFR.md)

## Development Quick Start

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

Core scripts:

```bash
npm run typecheck
npm run lint
npm run build
bash scripts/check-dev.sh
```

## Testing and Quality

Testing strategy prioritizes critical learning and generation paths.

- Unit/integration baseline uses Vitest and repository test scripts.
- Quality gates: typecheck + lint + build checks.
- Targeted coverage and roadmap are defined in the testing strategy doc.

References:
- [Testing Strategy](DWF/TESTING_STRATEGY.md)
- [NFR](DWF/NFR.md)

## Product and UX Principles

- Mobile-first, approachable learning UX.
- Consistent shell patterns across Create, Play, Results, and Achievements.
- Border-first visual hierarchy with restrained elevation.
- Finnish-first user experience for primary school audience.

References:
- [Design Guidelines](DWF/DESIGN_GUIDELINES.md)
- [Personas](DWF/PERSONAS.md)
- [User Journeys](DWF/USER_JOURNEYS.md)
- [Wireframes](DWF/WIREFRAMES.md)

## Source Documents

- [DWF/CORE_ARCHITECTURE.md](DWF/CORE_ARCHITECTURE.md)
- [DWF/COMPONENTS.md](DWF/COMPONENTS.md)
- [DWF/DATA_MODEL.md](DWF/DATA_MODEL.md)
- [DWF/DESIGN_GUIDELINES.md](DWF/DESIGN_GUIDELINES.md)
- [DWF/DESIGN_IMPROVEMENTS.md](DWF/DESIGN_IMPROVEMENTS.md)
- [DWF/METRICS.md](DWF/METRICS.md)
- [DWF/NFR.md](DWF/NFR.md)
- [DWF/PERSONAS.md](DWF/PERSONAS.md)
- [DWF/TESTING_STRATEGY.md](DWF/TESTING_STRATEGY.md)
- [DWF/USER_JOURNEYS.md](DWF/USER_JOURNEYS.md)
- [DWF/WIREFRAMES.md](DWF/WIREFRAMES.md)
