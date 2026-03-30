# Israeli Finance Dashboard

A client-side React app for analyzing Israeli bank exports (CSV/Excel). Parses transactions, auto-categorizes spending, visualizes trends, and optionally generates AI insights via the Claude API. Zero backend — everything runs in the browser.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build → /dist
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

## Architecture

Single-file React app — all logic lives in `src/App.jsx` (~630 lines):

- **Styles** — embedded CSS string with CSS custom properties (`--bg`, `--accent`, `--text`, etc.)
- **Category engine** — `SECTOR_MAP` + `CATEGORY_RULES` + `categorize()` auto-tag transactions from description and bank sector fields
- **Parser** — `detectAndParse()` handles Excel/CSV with auto-detected headers, multiple date formats, Hebrew/English column names, and multi-bank exports
- **Charts** — Recharts `BarChart` (monthly spend), `PieChart` (categories), horizontal `BarChart` (top merchants)
- **AI panel** — calls Claude Sonnet 4.6 via `runAI()`; API key held in React state only, never persisted

## Key Conventions

- **Hebrew-first UI** — `lang="he"` + `dir="rtl"` in `index.html`; all labels in Hebrew; currency ₪
- **Embedded styles** — all CSS lives in the template literal at the top of `App.jsx`, not in separate `.css` files
- **Memoized derivations** — filtered/aggregated data and chart datasets all computed with `useMemo`; don't break this pattern when adding new derived state
- **Privacy-first** — no backend, no data leaves the browser except the optional Claude API call; keep it that way
- **Supported banks** — IsraelCard, Max, Cal, Poalim, Leumi, Discount, Mizrahi (column name variants handled in parser)

## Tech Stack

| Layer | Library |
|-------|---------|
| UI | React 19, Recharts 3 |
| Build | Vite 7 |
| File parsing | SheetJS (xlsx 0.18) |
| AI insights | Anthropic Claude API (`claude-sonnet-4-6`) |
| Font | Google Fonts — Assistant |
