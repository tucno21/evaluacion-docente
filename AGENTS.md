# AGENTS.md

## Commands

```bash
npm run dev       # dev server (vite --host)
npm run build     # tsc -b && vite build
npm run lint      # eslint .
```

No test runner is configured. No typecheck-only command exists (typecheck runs as part of `npm run build`).

**Before finishing a task:** run `npm run build` (catches TS errors) and `npm run lint`.

## Architecture

Single-page React 19 + TypeScript app. No backend — all data lives in IndexedDB via a custom wrapper.

**Data flow:** UI pages → Zustand store (`useAppStore`) → IndexedDB utils (`indexDB.ts`). The store holds arrays in memory and dispatches to IndexedDB for persistence. There is no API layer.

**Key dependency chain for adding a new entity type:**
1. `src/types/types.ts` — define the TypeScript interface
2. `src/utils/indexDB.ts` — add store name to `STORES`, bump `DB_VERSION`, add CRUD functions
3. `src/store/useAppStore.ts` — add state + actions
4. Page component in `src/pages/`

**Routing:** `src/router/Router.tsx` uses `createBrowserRouter`. All pages are children of `MainLayout`.

**Two Zustand stores:**
- `useAppStore` — all domain data and CRUD
- `useHeaderStore` — just the dynamic header title string

## IndexedDB Gotchas

- DB name: `teacher-evaluation-app`, current version: **5**
- When adding a new object store, you **must** increment `DB_VERSION` in `src/utils/indexDB.ts`, otherwise the `onupgradeneeded` handler never fires and the store is never created
- IDs are UUID v4 strings generated client-side
- Backup/restore exports all stores as a single JSON file; restore only works when no classrooms exist (`checkIfDataExists` gates the restore button)

## Styling

- TailwindCSS 4 via `@tailwindcss/vite` plugin (not PostCSS)
- All custom colors defined as CSS custom properties in `src/index.css` under `@theme { }`
- Dark mode: toggled by adding/removing `.dark` class on `<html>`, using `@custom-variant dark` in Tailwind
- Dark mode color tokens are prefixed `dark-` (e.g. `dark-bg-card`, `dark-text-primary`, `dark-border`)
- No CSS modules, no styled-components — all Tailwind utility classes inline in JSX

## Excel Generation

`src/utils/excel.ts` uses `xlsx-js-style` (not plain `xlsx`) for styled Excel output. Functions generate `Blob` objects that are downloaded via anchor elements. The `parseExcelStudents` function expects columns `nombreCompleto` and `gradoSec`.

## Language Convention

- Code identifiers (types, variables, functions): **English**
- All user-facing strings (labels, placeholders, errors, modals): **Spanish**
- Code comments: minimal, mostly Spanish

## Vercel Deployment

`vercel.json` contains a single rewrite `{ source: "/(.*)", destination: "/index.html" }` for SPA routing. Build output goes to `dist/`.

## PWA

Service worker at `public/sw.js` uses cache-first strategy. Asset filenames are fixed via `vite.config.ts` `rollupOptions.output` (no content hashes) so the SW cache list stays valid.
