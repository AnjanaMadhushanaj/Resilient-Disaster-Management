'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Monitored site. Replace with live coordinates once telemetry carries a location.
export const SITE = {
  name: 'Monitored site, Sri Lanka',
  center: [80.7718, 7.8731], // [longitude, latitude]
  zoom: 7,
};

export default function MapView({ isFlood }) {
  const containerRef = useRef(null);
  const markerRef = useRef(null);

  // Inlined at build time by the NEXT_PUBLIC_MAPBOX_TOKEN build arg.
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: SITE.center,
      zoom: SITE.zoom,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

    // Elevation shading, so the central highlands read as terrain rather than flat imagery.
    map.on('load', () => {
      map.addSource('terrain-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: 'terrain-dem', exaggeration: 1.5 });
    });

    const markerEl = document.createElement('div');
    markerEl.className = 'site-marker';

    markerRef.current = new mapboxgl.Marker({ element: markerEl })
      .setLngLat(SITE.center)
      .addTo(map);

    return () => {
      map.remove();
      markerRef.current = null;
    };
  }, [token]);

  // Applied separately so the marker is not rebuilt when the status flips.
  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (el) {
      el.classList.toggle('site-marker--flood', isFlood);
    }
  }, [isFlood]);

  if (!token) {
    return (
      <div className="map map--notice">
        <p className="map__title">Map unavailable</p>
        <p className="map__hint">
          Set NEXT_PUBLIC_MAPBOX_TOKEN to render the satellite view.
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="map" />;
}
