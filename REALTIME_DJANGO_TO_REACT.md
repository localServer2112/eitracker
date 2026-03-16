# Realtime flow: Django → React

This document describes how a message published from the Django app is received in a React app using **djangorealtime** (djrealtime): Server-Sent Events (SSE) over HTTP, with PostgreSQL NOTIFY/LISTEN on the backend.

---

## 1. High-level flow

```
┌─────────────────┐     POST /api/v1/sensor-data/      ┌──────────────────┐
│  Client / IoT    │ ───────────────────────────────► │  Django app      │
│  (sends sensor   │                                    │  • Save to DB    │
│   data)          │                                    │  • publish_global│
└─────────────────┘                                    └────────┬─────────┘
                                                                 │
                                                                 │ PostgreSQL
                                                                 │ NOTIFY
                                                                 ▼
┌─────────────────┐     SSE stream (GET)               ┌──────────────────┐
│  React app      │ ◄────────────────────────────────── │  djangorealtime  │
│  (EventSource)  │     events as "djr:sensor_data"    │  • LISTEN        │
│                 │     with payload in e.detail        │  • HTTP SSE     │
└─────────────────┘                                    └──────────────────┘
```

1. **Django** receives sensor data, saves it, then calls `publish_global('sensor_data', payload)`.
2. **djangorealtime** stores the event and uses PostgreSQL NOTIFY so any Django instance can push it.
3. **React** opens an SSE connection to the same Django API base URL. The library sends events; the browser fires a custom event `djr:sensor_data` with the payload in `event.detail`.

---

## 2. Django side (what you have)

**Publish in a view** (`data_logger/views.py`):

```python
from djangorealtime import publish_global

# After saving sensor data:
payload = dict(serializer.data)  # JSON-serializable (e.g. datetime → iso string)
publish_global('sensor_data', payload)
```

**URLs** (your API is under `/api/v1/`, realtime under that):

- API base: `https://your-domain.com/api/v1/`
- Realtime (SSE) is included at: `https://your-domain.com/api/v1/realtime/...`  
  (exact path is defined by djangorealtime; often something like `/realtime/stream/` or similar—check the package’s `urls.py` or docs.)

The **event type** you pass is `'sensor_data'`. The client will receive it as the event name **`djr:sensor_data`** (the package prefixes with `djr:`).

---

## 3. React side: receiving the published message

The React app must:

1. Connect to the SSE endpoint (same origin as your API, or a CORS-allowed origin).
2. Listen for the custom event **`djr:sensor_data`**.
3. Read the payload from **`event.detail`**.

djangorealtime can load its own script (e.g. from a Django template) that opens the EventSource and dispatches these custom events. In a React SPA you typically either:

- Use the package’s JavaScript from a small Django-served HTML shell that loads your React app, or  
- Open an **EventSource** in React toward the realtime URL and then listen for `djr:sensor_data` on `window` (or on a small bridge that re-dispatches from the EventSource).

Below is a **minimal snippet** that assumes the library exposes an SSE URL and dispatches `djr:sensor_data` on `window`. If your package uses a different API (e.g. a JS SDK with a callback), replace the EventSource part with that; the important part is: **event name `djr:sensor_data`, payload in `e.detail`**.

### 3.1 Option A: Listen for the event on `window`

If djangorealtime’s script runs (e.g. in an iframe or a parent page that loads the script) and dispatches events on `window`, React only needs to subscribe:

```jsx
import { useEffect, useState } from 'react';

const API_BASE = 'https://your-domain.com/api/v1';  // or process.env.REACT_APP_API_URL

export function useSensorDataRealtime() {
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      // e.detail is the payload you passed to publish_global('sensor_data', payload)
      setLatest(e.detail);
    };

    window.addEventListener('djr:sensor_data', handler);
    return () => window.removeEventListener('djr:sensor_data', handler);
  }, []);

  return latest;
}

// Usage in a component:
function Dashboard() {
  const sensorData = useSensorDataRealtime();
  return (
    <div>
      {sensorData && (
        <pre>{JSON.stringify(sensorData, null, 2)}</pre>
      )}
    </div>
  );
}
```

### 3.2 Option B: Connect with EventSource from React

If you open the SSE connection yourself (e.g. the package exposes a URL like `/api/v1/realtime/stream/` and you need to pass a token in the query string):

```jsx
import { useEffect, useState } from 'react';

const API_BASE = 'https://your-domain.com/api/v1';  // same origin as API

export function useSensorDataRealtime(token) {
  const [latest, setLatest] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    // SSE URL: adjust path to match djangorealtime's actual endpoint (see package docs)
    const url = `${API_BASE}/realtime/stream/?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    // djangorealtime sends events; the event type becomes djr:sensor_data
    es.addEventListener('sensor_data', (e) => {
      const data = e.data ? JSON.parse(e.data) : {};
      setLatest(data);
      // Optionally dispatch so other parts of the app can listen on window
      window.dispatchEvent(new CustomEvent('djr:sensor_data', { detail: data }));
    });

    return () => {
      es.close();
      setConnected(false);
    };
  }, [token]);

  return { latest, connected };
}
```

**Note:** EventSource in browsers does not send custom headers. If the realtime endpoint requires auth, you must pass the token in the URL (e.g. query param) and ensure the backend accepts it. Your Django CORS and djangorealtime settings must allow the React origin.

---

## 4. End-to-end summary

| Step | Where | What happens |
|------|--------|----------------|
| 1 | Client/IoT | POST `/api/v1/sensor-data/` with body + auth token |
| 2 | Django view | Validate, save to DB, then `publish_global('sensor_data', payload)` |
| 3 | djangorealtime | Persists event, uses PostgreSQL NOTIFY |
| 4 | React app | Connected via SSE to `/api/v1/realtime/...` |
| 5 | React app | Receives event `djr:sensor_data`; payload in `event.detail` (or from EventSource `e.data` parsed as JSON) |
| 6 | React | Update state and re-render (e.g. show latest sensor reading) |

**Event name:** `djr:sensor_data`  
**Payload:** The dict you passed to `publish_global` (e.g. serialized sensor record with `id`, `created_at`, `vehicle_plate_number`, etc.).

---

## 5. CORS and auth

- **CORS:** If the React app is on a different origin than the API, the Django app must allow that origin for the realtime endpoint (e.g. `CORS_ALLOW_ALL_ORIGINS` or `CORS_ALLOWED_ORIGINS` in your settings).
- **Auth:** If the SSE endpoint is protected, use token-in-query or whatever the package supports; EventSource cannot send `Authorization` headers.

For the exact SSE URL path and auth requirements, refer to the **djrealtime** (djangorealtime) documentation or its `urls.py` in the installed package.
