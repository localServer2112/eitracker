# Tracker

A cold-chain fleet tracker: a live map of refrigerated vans and freezers (Ibadan-centered), with per-fleet CSV export.

## Stack

- React 18 + Vite 5
- Tailwind CSS 3 with shadcn-style UI components
- react-leaflet 4 / Leaflet 1.9 for the map
- Vitest + MSW + Testing Library for tests
- Deployed on Vercel, with `/api` and `/freezer-api` proxy rewrites (`vercel.json`)

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

Fill in the values in `.env` as needed (see Environment variables below).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE` | No (defaults to `/api/v1`) | Base URL for the vehicle/van tracking API. |
| `VITE_FREEZER_API_BASE` | No (defaults to `/freezer-api/v1`) | Base URL for the freezer tracking API. |
| `VITE_MAPBOX_TOKEN` | No | Optional Mapbox token; enables the traffic layer on the map when set. |

In local dev, `VITE_API_BASE` and `VITE_FREEZER_API_BASE` are typically left unset so requests go through the same-origin proxies configured in `vite.config.js` (mirrored in production by `vercel.json`).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Build for production. |
| `npm run lint` | Run ESLint. |
| `npm run preview` | Preview the production build locally. |
| `npm test` | Run the test suite (Vitest). |

## Architecture

This is a single-page app (SPA). Two separate Django backends provide data: one for vehicle/van sensor data, one for freezer sensor data. In development, `vite.config.js` proxies `/api` and `/freezer-api` to those backends so the browser only ever talks to the same origin; in production, `vercel.json` performs the equivalent rewrites. After login, the app polls each backend's "all sensors" endpoint every 120 seconds (no WebSockets or Server-Sent Events) and renders vans and freezers as markers on a Leaflet map. Each fleet (vans, freezers) can be exported to CSV from its list view. Implementation plans for future work live in `plans/`.

## Testing

Tests use Vitest with MSW for mocking network requests and Testing Library for component tests. Run the suite with:

```bash
npx vitest run
```
