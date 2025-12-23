# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Koekertaaja project, a Finnish educational quiz and flashcard study application built with Next.js 16 (App Router). The integration includes:

- **Client-side initialization** using `instrumentation-client.ts` (Next.js 15.3+ pattern)
- **Server-side analytics** via `posthog-node` for API route tracking
- **Reverse proxy setup** to avoid ad blockers via Next.js rewrites
- **User identification** linking authenticated users to their analytics data
- **Error tracking** with automatic exception capture
- **14 custom events** covering the complete user journey from quiz creation to completion

## Events Implemented

| Event Name | Description | File Path |
|------------|-------------|-----------|
| `quiz_session_started` | User starts a quiz session by loading a question set | `src/app/play/[code]/page.tsx` |
| `quiz_session_completed` | User completes a quiz session with score and performance data | `src/components/play/ResultsScreen.tsx` |
| `question_answered` | User submits an answer to a question (tracks correctness, points) | `src/hooks/useGameSession.ts` |
| `flashcard_session_started` | User begins a flashcard study session | `src/components/play/FlashcardSession.tsx` |
| `flashcard_session_completed` | User completes all flashcards in a study session | `src/components/play/FlashcardSession.tsx` |
| `question_set_created` | Admin successfully creates a new question set via AI generation | `src/app/create/page.tsx` |
| `question_set_extended` | Admin extends an existing question set with additional questions | `src/app/create/page.tsx` |
| `question_set_deleted` | Admin deletes a question set | `src/app/create/page.tsx` |
| `user_signed_in` | Admin user successfully signs in to the application | `src/hooks/useAuth.ts` |
| `user_signed_out` | User signs out of the application | `src/hooks/useAuth.ts` |
| `badge_unlocked` | User unlocks a new achievement badge | `src/components/play/ResultsScreen.tsx` |
| `personal_best_achieved` | User achieves a new personal best score on a question set | `src/components/play/ResultsScreen.tsx` |
| `material_uploaded` | User uploads material files for question generation | `src/components/create/MaterialUpload.tsx` |
| `question_set_loaded_by_code` | User loads a question set using a share code | `src/app/play/[code]/page.tsx` |

## Files Created/Modified

### New Files
- `instrumentation-client.ts` - Client-side PostHog initialization
- `src/lib/posthog-server.ts` - Server-side PostHog client
- `.env` - Environment variables with PostHog API key and host

### Modified Files
- `next.config.js` - Added reverse proxy rewrites and updated CSP headers
- `.env.example` - Added PostHog environment variable examples
- `src/hooks/useAuth.ts` - Added user identification and sign in/out tracking
- `src/hooks/useGameSession.ts` - Added question answered tracking
- `src/app/play/[code]/page.tsx` - Added quiz session and question set loading tracking
- `src/components/play/ResultsScreen.tsx` - Added quiz completion, badges, and personal best tracking
- `src/components/play/FlashcardSession.tsx` - Added flashcard session tracking
- `src/app/create/page.tsx` - Added question set creation, extension, and deletion tracking
- `src/components/create/MaterialUpload.tsx` - Added material upload tracking

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://eu.posthog.com/project/110648/dashboard/468284) - Main analytics dashboard

### Insights
- [Quiz Sessions Started (Weekly)](https://eu.posthog.com/project/110648/insights/a0FbmQE4) - Track weekly quiz session volume
- [Quiz Completion Rate](https://eu.posthog.com/project/110648/insights/PLkIohAw) - Funnel showing quiz start to completion conversion
- [Question Set Creation](https://eu.posthog.com/project/110648/insights/gV4IQ8ab) - Track content creation activity
- [User Sign-ins (Weekly)](https://eu.posthog.com/project/110648/insights/8OLcfKXT) - Monitor user authentication activity
- [Quiz Performance - Correct Answers Rate](https://eu.posthog.com/project/110648/insights/OwAAQ6an) - Measure learning effectiveness

## Configuration

PostHog is configured with:
- **API Key**: Set via `NEXT_PUBLIC_POSTHOG_KEY` environment variable
- **Host**: EU region (`https://eu.i.posthog.com`)
- **Reverse Proxy**: Events routed through `/ingest` to avoid ad blockers
- **Error Tracking**: Automatic exception capture enabled
- **Debug Mode**: Enabled in development environment
