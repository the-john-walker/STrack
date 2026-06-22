# STrack — Rebuild as React + Vite + TypeScript, with accounts (Claude Code brief)

Attach the current **`index.html`** to the Claude Code session along with this brief. That file is the **reference / source of truth** — recreate its look and behavior exactly, then add accounts. Build in the repo `github.com/the-john-walker/STrack`.

---

## Goal
Rebuild the existing single-file `index.html` study tracker as a clean, organized **React + Vite + TypeScript** project that faithfully recreates every current feature and the exact visual design, then add **Supabase accounts + cloud sync** and the feature changes below. Make it a tidy open-source repo and deploy on Cloudflare Pages.

## Rules
- The attached `index.html` is the spec. **Do not drop features or change the visual style.** When unsure, match the HTML.
- Get **visual + functional parity first** (still using localStorage), then layer accounts on top.
- Keep the original file in the repo at `reference/index.html` until parity is confirmed. Don't delete it.

## Tech
- **Vite + React + TypeScript.**
- Styling: keep the same design system. Mirror the current CSS variables/tokens (palette, radii, shadows) in a global stylesheet or CSS modules. Keep **Montserrat** self-hosted (woff2 in `public/fonts`, via `@font-face`). Do not change palette, fonts, or look. Keep tabular numerals on all numbers. **No em dashes anywhere.**
- State: React hooks + context (or a small store like Zustand if helpful).
- Data/auth: `@supabase/supabase-js`.

## Suggested structure
```
STrack/
  index.html                 Vite entry
  package.json  vite.config.ts  tsconfig.json
  .env                       VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
  public/fonts/              montserrat *.woff2
  src/
    main.tsx  App.tsx
    lib/supabase.ts          client + typed queries
    state/                   store + hooks
    styles/                  tokens + global css
    components/
      Landing.tsx            intro/landing (nav, version, GitHub/Blog/Support, preview, features, footer w/ Share + Contact)
      TopBar.tsx  Hero.tsx  StreakBadge.tsx
      FocusTimer.tsx         flip clock + transparent clock + backgrounds
      LogSession.tsx  DatePicker.tsx
      WeeklyGoals.tsx  StudyPlanModal.tsx
      WeekChart.tsx  MonthHeatmap.tsx  History.tsx
      InsightsModal.tsx      all-data (masonry stats, mini-graphs, weekly/daily x bars/line)
      Settings.tsx           sectors/subjects/methods CRUD, autofill, export/import
      Auth.tsx               login screen
  reference/index.html       the original (do not ship)
  README.md  LICENSE  CONTRIBUTING.md  .gitignore
```

## Features to recreate exactly (from index.html)
- **Landing page**: dot-grid background, top nav (checkbox logo + "STrack" + "1.0" badge, GitHub/Blog/Support links, Open STrack button), centered hero (eyebrow, large headline "Track your studying. Save time.", one-line about, Open button) with an animated app-preview mock (browser frame, mono stats, flame, growing bars), a bridge sentence, a 4-card features row, and a footer (tagline + Share link using Web Share API with copy fallback + Contact button = mailto). About button in the app header reopens it; shows once per visitor via stored flag.
- **Theme**: Auto/Light/Dark, the muted academic palette + warm flame accent.
- **Hero strip**: time-aware greeting; live Today / This week / Weekly goal % / Streak; header flame streak badge.
- **Focus timer**: always-dark; flip clock + transparent clock (tabular numerals); 5 animated backgrounds + image/gif upload + transparent-clock toggle; click-to-dim; Esc/End to exit; prompt to log time on finish.
- **Log a session**: total minutes (no negatives), themed rounded date picker (no future dates), multi-select subjects (chips) with optional minutes-per-item split, method dropdown, notes with toggleable hint panel.
- **Weekly goals**: categories with editable hour goals + progress bars; "Study plan" modal with 3 rotating variants, per-step detail expanders, and a custom-plan builder.
- **Charts**: hours-this-week bar chart with value labels + tap-to-expand; monthly heatmap shaded by hours + Less/More legend + tap any day; day-streak counter; monthly totals.
- **History**: confirm-before-delete, Recently deleted/Restore (last 50), Export/Import JSON.
- **All-data insights modal**: masonry stat cards with icons + mini-graphs (7-day sparkline, weekday bars, flame icons); an Activity section with two independent toggles (Bars/Line and Weekly/Daily = 4 views); breakdowns by category, top subjects, top methods.

## New: accounts + cloud sync (Supabase)
- **Auth**: Supabase email magic-link (optionally Google later). Login screen; app gated behind a session; sign-out control.
- **Database** (Postgres), every table `user_id uuid not null default auth.uid()` with **RLS on** (owner-only select/insert/update/delete):
  - `sectors` (name, color, goal_hours, sort_order)
  - `subjects` (sector_id fk, name)
  - `methods` (name)
  - `sessions` (date, total_min, method_id, notes, items jsonb = [{subject_id, minutes}])
  - `custom_plans` (sector_id, title, steps jsonb)
  - optional `trash` for restore
- **New users start BLANK**: no preset sectors/goals/plans.
- **Full CRUD** for sectors, subjects (assigned to a sector), and methods (replace the hardcoded method list; allow custom).
- **"Autofill my setup"** button: one click loads MY personal template (my sectors + weekly goals + method list + study-plan templates) from an editable JSON constant. **Do NOT hardcode my specific projects/subjects** — I add those myself. Can double as a generic starter template.
- **Migrate** existing localStorage data into the account on first login if the account is empty. Keep localStorage as an offline cache.
- Keep **Export/Import JSON**.

## Open-source scaffolding
- **LICENSE**: MIT, author "John Walker".
- **README.md**: what STrack is, live link, screenshots, "run locally" (`npm i`, `npm run dev`), tech stack, link to CONTRIBUTING.
- **CONTRIBUTING.md**: how to set up, branch, and open a PR; code style notes.
- **.gitignore**: `node_modules`, `dist`, `.env`, `.DS_Store`.

## Deploy (Cloudflare Pages)
- Connect the repo. **Build command `npm run build`**, **output directory `dist`**, Node 18+.
- Put `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in a local `.env` and add them as Environment Variables in Cloudflare Pages settings. (The anon key is public-safe with RLS on; env vars just keep it out of the committed source.)
- Set the Supabase Auth redirect URL to the live Cloudflare/domain URL so magic links work.

## Build order
1. Scaffold Vite + React + TS; port the design tokens, global CSS, and Montserrat fonts to match exactly.
2. Recreate the Landing page.
3. Recreate the app shell + each feature component, matching `index.html`, using localStorage. Verify parity feature-by-feature.
4. Add Supabase auth; move storage to cloud with localStorage cache.
5. Sectors/subjects/methods CRUD + blank default + autofill template + first-login migration.
6. Add LICENSE, CONTRIBUTING, README, .gitignore.
7. Deploy to Cloudflare Pages (env vars + build settings); set Supabase redirect URL.

## Lower-risk alternative (if a full rewrite feels too big)
Instead of React, split the existing vanilla code into a Vite project: `index.html` + `src/` JS modules + `css/` + `public/fonts/`, same logic, bundled by Vite. Same deploy settings. Then add accounts the same way. This recreates the app with near-zero regression risk but is less standard for contributors than React.
