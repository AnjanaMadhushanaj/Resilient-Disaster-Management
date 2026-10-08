'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// mapbox-gl touches `window` at import time, so the map is loaded client-side only.
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="map map--notice">Loading map...</div>,
});

const POLL_INTERVAL_MS = 2000;

// NEXT_PUBLIC_API_URL is inlined by `next build` (fed by the Docker build arg in
// docker-compose.yml). If it is missing, fall back to the host serving this page
// so the dashboard still reaches the API on port 3000.
//
// Called inside an effect because `window` is unavailable during prerendering.
function resolveApiUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return `${window.location.protocol}//${window.location.hostname}:3000`;
}

export default function Dashboard() {
  const [reading, setReading] = useState(null);

  useEffect(() => {
    const apiUrl = resolveApiUrl();

    const poll = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/status`, { cache: 'no-store' });
        setReading(await res.json());
      } catch {
        // Keep the last known reading if a poll fails.
      }
    };

    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const isFlood = reading?.status === 'Flood Level';

  return (
    <main className={isFlood ? 'screen flood' : 'screen normal'}>
      <header className="banner">
        <p className="label">Resilient Flood Detection System</p>

        <h1 className="headline">{isFlood ? 'FLOOD EMERGENCY' : 'SAFE'}</h1>

        <p className="status">
          Status: {reading?.status ?? 'Waiting for edge telemetry...'}
        </p>

        <p className="level">
          Water Level:{' '}
          {reading?.waterLevel !== undefined && reading?.waterLevel !== null
            ? `${reading.waterLevel} cm`
            : '--'}
        </p>

        {isFlood && (
          <p className="ussd">[USSD GATEWAY] Emergency alert dispatched to *119#</p>
        )}

        <p className="stamp">
          {reading?.updatedAt
            ? `Last update: ${new Date(reading.updatedAt).toLocaleTimeString()}`
            : ''}
        </p>
      </header>

      <div className="map-panel">
        <MapView isFlood={isFlood} />
      </div>
    </main>
  );
}
