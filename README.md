# Brochify

AI-Powered University Brochure Builder.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`:

   ```env
   OPENROUTER_API_KEY=your_key
   NEXT_PUBLIC_FAL_API_KEY=your_key
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## Folder Structure

- `/app`: App router entrypoints, route groups, and API routes only
- `/components`: UI layer organized by domain (`studio`, `shared`) with compatibility wrappers for legacy paths
- `/lib`: Core utilities organized by domain (`domains`, `services`, `system`, `ui`) with compatibility wrappers for legacy imports

## Components Structure

- `/components/studio/canvas`: Brochure canvas rendering and overlay interaction components
- `/components/studio/editor`: Studio-side editing panels and tools
- `/components/shared/feedback`: Shared cross-feature feedback UI (loading states, status surfaces)
- `/components/index.ts`: Top-level barrel exports

## Lib Structure

- `/lib/domains/brochure`: Brochure data models and transform helpers
- `/lib/services/ai`: OpenRouter and image-generation clients
- `/lib/system/loading`: Loading state metadata and task definitions
- `/lib/system/logging`: API telemetry logger
- `/lib/system/content`: Content limits and truncation utilities
- `/lib/ui`: UI-oriented utility helpers (`cn`, etc.)
- `/lib/index.ts`: Top-level barrel exports

## App Router Structure

- `/app/layout.tsx`: Root shell and global metadata
- `/app/(studio)/page.tsx`: Thin route entry for the brochure studio
- `/app/api/_shared/handlers`: Reusable API business handlers
- `/app/api/v1/brochure/generate/route.ts`: Versioned brochure generation endpoint
- `/app/api/v1/brochure/pdf/route.ts`: Versioned PDF export endpoint
- `/app/api/generate-brochure/route.ts`: Legacy compatibility endpoint
- `/app/api/generate-pdf/route.ts`: Legacy compatibility endpoint

## Feature Modules

- `/features/studio/pages/BrochureStudioPage.tsx`: Main studio implementation (moved out of app router)

## New Core Architecture (Placeholder Scaffold)

The project now includes a future-ready core layer for manager/service based growth:

- `/core/contracts`: Shared manager contracts
- `/core/managers/security`: Security manager placeholder
- `/core/managers/crypto`: Crypto manager placeholder
- `/core/managers/notification`: Notification/toast manager placeholder
- `/core/managers/user`: User scaling manager placeholder
- `/core/services`: Service wrappers for each manager
- `/core/registry`: Central manager registry and bootstrap helpers

Use these scripts during incremental implementation:

```bash
npm run temp:bootstrap
npm run temp:verify
```
