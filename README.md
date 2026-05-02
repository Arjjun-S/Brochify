# Brochify

AI-Powered University Brochure Builder.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

   If installation fails while Puppeteer tries to download browsers (common in locked-down Windows environments), you can skip the download and use a locally installed Chrome/Edge instead:

   ```powershell
   $env:PUPPETEER_SKIP_DOWNLOAD = "1"
   npm ci
   ```

   If you don't have Chrome/Edge in standard locations, set `PUPPETEER_EXECUTABLE_PATH` to the browser executable.

2. Set up environment variables in `.env.local`:

   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/brochify"
   SESSION_SECRET=replace_with_secure_random_value
   OPENROUTER_API_KEY=your_key
   NEXT_PUBLIC_FAL_API_KEY=your_key
   ```

3. Apply Prisma schema to your database:

   ```bash
   npm run prisma:push
   ```

4. If your database already has these tables, baseline the initial Prisma migration:

   ```bash
   npx prisma migrate resolve --applied 20260502084500_init
   ```

5. For fresh environments, apply tracked migrations:

   ```bash
   npm run prisma:deploy
   ```

6. Run development server:
   ```bash
   npm run dev
   ```

## Local Database (Docker)

If your current `DATABASE_URL` points to a remote MySQL instance that is not reachable from your machine (VPN/firewall/offline), you can run a local MySQL for development:

1. Start MySQL:

   ```bash
   docker compose up -d db
   ```

2. Create a `.env.local` based on `.env.local.example` and ensure `DATABASE_URL` points to `localhost`.

3. Create tables in the local DB:

   ```powershell
   # Prisma CLI loads `.env` by default. If your `.env` points to a remote DB,
   # temporarily override DATABASE_URL for this shell when pushing the schema.
   $env:DATABASE_URL = "mysql://root:brochify@localhost:3306/brochify"
   npm run prisma:push
   ```

Then restart `npm run dev`.

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
