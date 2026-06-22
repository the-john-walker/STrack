# STrack

A personal study tracker. Log sessions, set weekly goals by subject area, track progress on a heatmap, and run focus timers with ambient sound. Built with React, Vite, TypeScript, and Supabase.

## Features

- Log study sessions with subjects, method, time, and notes
- Weekly goals per sector with progress bars
- Month heatmap and week-by-week charts
- Focus timer (countdown, stopwatch, Pomodoro) with ambient noise and end chimes
- Magic-link login, cloud sync across devices, and offline-first localStorage fallback
- Saved setup variants to switch between schedules

## Run locally

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`. Without Supabase keys it works fully offline.

## Supabase setup (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy your project URL and anon key from **Project Settings > API**.
4. Create a `.env` file at the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. In **Authentication > URL Configuration**, set the Site URL to `http://localhost:5173` for local dev.
6. Restart the dev server. The app will show a magic-link login screen.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

## License

MIT. See [LICENSE](LICENSE).
