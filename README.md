# EWM Mastery — SAP EWM Support & Interview Prep

**🔗 Live: https://ewm.avinashchavan.com**

A free, fully client-side study app for SAP EWM support consultants and interview candidates,
by **Avinash Chavan**. No login, no signup, no backend, no database — open for everyone. All
content ships as static JSON.

- **26** realistic support incidents written as runbooks
- **21** study days · **630** interview Q&A
- Flashcards (self-graded, requeue), quizzes (self-scored), global search
- 3 downloadable governance templates (`.xlsx`)
- Light / dark mode, keyboard-driven, WCAG-AA, offline

Progress (reviewed questions, streak, quiz history) is stored **only** in your browser's
`localStorage`. Nothing is uploaded or tracked.

---

## Stack

React 18 · Vite · TypeScript · react-router-dom (HashRouter) · Tailwind CSS. No component
libraries, no runtime external APIs / fonts / CDNs, no analytics. Routes are code-split; the
630-item search index is memoized.

Design tokens, microcopy, the progress model, the localStorage schema, and the 7-parent
process-area grouping come from the Claude Design project (`ux/06-ux-spec.md`,
`ux/03-information-architecture.md`, `design/design-system.dc.html`).

## Run locally

```bash
cd app
npm install
npm run dev        # http://localhost:5173
```

## Build & preview

```bash
npm run build      # type-check + production build → dist/
npm run preview    # serve dist/ locally
```

`vite.config.ts` sets `base: './'`, so `dist/` is a self-contained static bundle that works from
any path (including `file://`) — the app uses hash routing (`#/incidents/EWM-001`) so deep links
survive a static host with no server rewrites.

## Deploy (one step)

`dist/` is deployable as-is. Any of:

- **Netlify** — `npm run build`, publish directory `app/dist` (drag-and-drop or `netlify deploy --dir=dist --prod`).
- **Vercel** — framework: Vite, root `app`, output `dist`.
- **GitHub Pages** — push `app/dist` to a `gh-pages` branch (e.g. `npx gh-pages -d dist`). Hash
  routing means no 404 fallback config is needed.

## Test & lint

```bash
npm run test       # Vitest + React Testing Library
npm run lint       # ESLint
```

Tests cover: JSON counts match `meta.json` (26 / 21 / 630), the process-area grouping table,
incident filtering, and flashcard flip.

---

## Data contract

Static JSON in `public/content/`, validated at startup (dev builds warn on mismatch).

### `meta.json`
```jsonc
{
  "product": string,
  "author": string,
  "version": string,
  "incidents": 26,
  "days": 21,
  "totalQuestions": 630,
  "processAreas": string[],
  "priorities": ["Critical", "High", "Medium", "Low"]
}
```

### `incidents.json` — 26 items
```jsonc
{
  "id": "EWM-001",
  "number": 1,
  "title": string,
  "priority": "Critical" | "High" | "Medium" | "Low",
  "processArea": string,       // one of meta.processAreas
  "tcodes": string[],
  "description": string,       // as reported
  "systemAnalysis": string[],  // diagnostic steps
  "rootCause": string,
  "resolution": string[],      // numbered steps
  "prevention": string         // preventive action / lesson learned
}
```

### `qa.json` — 21 days
```jsonc
{
  "day": 1,
  "title": string,
  "questionCount": 30,
  "questions": [{ "id": "D01-Q01", "question": string, "answer": string }]
}
```

TypeScript types for all three live in `src/types.ts`.

### localStorage schema (`ewm.*`, version 2)

| Key | Shape |
|---|---|
| `ewm.version` | `2` |
| `ewm.theme` | `"light" \| "dark" \| "system"` |
| `ewm.progress` | `{ reviewed: {qid: epochSec}, streak, lastActiveDate, quizHistory[] }` |
| `ewm.session` | `null \| {type:"day",…} \| {type:"cards",…}` |
| `ewm.recent` | last 5 viewed items |

## Keyboard shortcuts

`⌘K`/`Ctrl+K` search · `Esc` close · Day view `j`/`k` `Enter` `r` `←`/`→` · Incident detail
`[`/`]` · Flashcards & Quiz `Space` `1` `2`.

## Content updates

Replace the JSON in `public/content/` (keeping the schema) and the `.xlsx` in
`public/templates/`. Keep `meta.json` counts in sync — the app dev-warns and the test suite fails
if they drift.

## License / disclaimer

Scenarios are realistic composites written for training purposes; **not affiliated with or
endorsed by SAP SE**. SAP, SAP EWM and S/4HANA are trademarks of SAP SE.

© Avinash Chavan — EWM Mastery.
