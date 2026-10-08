'use client';

import dynamic from 'next/dynamic';
import {
  Activity,
  AlertTriangle,
  Battery,
  Camera,
  Clock,
  Crosshair,
  Gauge,
  Home,
  Phone,
  Plane,
  Radar,
  Radio,
  Satellite,
  Send,
  Shield,
  Signal,
  Siren,
  Thermometer,
  TrendingUp,
  Truck,
  Users,
  Waves,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { RESOURCES, SENSOR_NODES, UAV_FEEDS } from './mockData';

// mapbox-gl touches `window` at import time, so the map is loaded client-side only.
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="map map--notice">INITIALISING MAP LINK…</div>,
});

const POLL_INTERVAL_MS = 2000;
const HISTORY_LIMIT = 40;
const LEVEL_CRITICAL_CM = 75;

const RESOURCE_ICONS = { home: Home, truck: Truck, users: Users, shield: Shield };

const COMMANDS = [
  { id: 'alert', label: 'SEND MASS ALERT', Icon: Send, tone: 'danger' },
  { id: 'uav', label: 'DEPLOY UAV', Icon: Plane, tone: 'accent' },
  { id: 'civil', label: 'CIVIL DEFENSE LINK', Icon: Phone, tone: 'accent' },
  { id: 'siren', label: 'SIREN ACTIVATION', Icon: Siren, tone: 'accent' },
];

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

function DigitalClock() {
  // Starts null so the server-rendered markup and the first client render agree.
  const [now, setNow] = useState(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className="clock clock--pending">--:--:--</div>;
  }

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const date = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="clock">
      <span className="clock__time">
        {hh}
        <em>:</em>
        {mm}
        <em>:</em>
        {ss}
      </span>
      <span className="clock__date">{date} · LK</span>
    </div>
  );
}

function GaugeRing({ label, display, unit, pct, tone }) {
  const RADIUS = 26;
  const CIRC = 2 * Math.PI * RADIUS;
  const clamped = Number.isFinite(pct) ? Math.max(0, Math.min(1, pct)) : 0;

  return (
    <div className={`gauge gauge--${tone}`}>
      <svg viewBox="0 0 64 64" className="gauge__svg" aria-hidden="true">
        <circle className="gauge__track" cx="32" cy="32" r={RADIUS} />
        <circle
          className="gauge__fill"
          cx="32"
          cy="32"
          r={RADIUS}
          strokeDasharray={`${(CIRC * clamped).toFixed(2)} ${CIRC.toFixed(2)}`}
        />
      </svg>
      <span className="gauge__value">{display}</span>
      <span className="gauge__unit">{unit}</span>
      <span className="gauge__label">{label}</span>
    </div>
  );
}

function Waveform({ points }) {
  const path = useMemo(() => {
    if (points.length < 2) {
      return '';
    }
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;

    return points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * 100;
        const y = 29 - ((p - min) / span) * 24;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }, [points]);

  return (
    <div className="wave-block">
      <div className="wave-block__head">
        <Waves size={13} />
        <span>STAGE HYDROGRAPH</span>
        <em>{points.length} samp</em>
      </div>
      <svg className="wave" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
        <line className="wave__baseline" x1="0" y1="15" x2="100" y2="15" />
        {path ? <path className="wave__path" d={path} /> : null}
      </svg>
    </div>
  );
}

function SignalBars({ strength }) {
  return (
    <span className="bars" aria-label={`signal ${strength} of 4`}>
      {[1, 2, 3, 4].map((i) => (
        <i key={i} className={i <= strength ? 'bar bar--on' : 'bar'} />
      ))}
    </span>
  );
}

function Panel({ title, icon: Icon, meta, children, grow }) {
  return (
    <section className={grow ? 'panel panel--grow' : 'panel'}>
      <header className="panel__head">
        <span className="panel__title">
          {Icon ? <Icon size={13} /> : null}
          {title}
        </span>
        {meta ? <span className="panel__meta">{meta}</span> : null}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  );
}

export default function Dashboard() {
  const [reading, setReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [online, setOnline] = useState(true);
  const [log, setLog] = useState([]);

  const seq = useRef(0);
  const lastStatus = useRef(null);

  const pushLog = useCallback((text, tone = 'info') => {
    seq.current += 1;
    const stamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLog((prev) => [{ id: seq.current, stamp, text, tone }, ...prev].slice(0, 60));
  }, []);

  useEffect(() => {
    const apiUrl = resolveApiUrl();

    const poll = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/status`, { cache: 'no-store' });
        const data = await res.json();

        setReading(data);
        setOnline(true);

        if (typeof data.waterLevel === 'number') {
          setHistory((h) => [...h, data.waterLevel].slice(-HISTORY_LIMIT));
        }

        if (data.status !== lastStatus.current) {
          pushLog(
            `STATUS TRANSITION → ${String(data.status).toUpperCase()}`,
            data.status === 'Flood Level' ? 'alert' : 'ok',
          );
          lastStatus.current = data.status;
        }
      } catch {
        setOnline(false); // keeps the last known reading on screen
      }
    };

    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [pushLog]);

  const isFlood = reading?.status === 'Flood Level';
  const level = typeof reading?.waterLevel === 'number' ? reading.waterLevel : null;

  const delta =
    history.length >= 2 ? history[history.length - 1] - history[history.length - 2] : 0;

  const runCommand = (label) => {
    pushLog(`CMD QUEUED · ${label} · SIMULATED, NOT TRANSMITTED`, 'warn');
  };

  return (
    <div className={isFlood ? 'cmd cmd--emergency' : 'cmd'}>
      {/* ---------- HEADER ---------- */}
      <header className="cmd__header">
        <div className="brand">
          <Radar size={20} className="brand__mark" />
          <div>
            <h1 className="brand__title">NATIONAL FLOOD COMMAND CENTER</h1>
            <p className="brand__sub">RESILIENT EDGE-CLOUD DISASTER RESPONSE</p>
          </div>
        </div>

        <div className={isFlood ? 'alertbar alertbar--live' : 'alertbar'}>
          {isFlood ? <AlertTriangle size={15} /> : <Shield size={15} />}
          <span>
            {isFlood ? 'WARNING: CRITICAL ALERT' : 'ALL SECTORS NOMINAL'}
          </span>
        </div>

        <DigitalClock />
      </header>

      {/* ---------- BODY ---------- */}
      <div className="cmd__grid">
        {/* ===== LEFT: hydrological & sensors ===== */}
        <div className="cmd__col">
          <Panel title="HYDROLOGICAL KINETICS" icon={Activity} meta="LIVE">
            <div className="levels">
              <span className="levels__value">
                {level === null ? '--.--' : level.toFixed(2)}
              </span>
              <span className="levels__unit">cm</span>
            </div>
            <p className="levels__caption">CURRENT LEVELS · KELANI GANGA UPPER</p>

            <div className="levels__rate">
              <TrendingUp size={13} className={delta > 0 ? 'up' : 'flat'} />
              <span className={delta > 0 ? 'up' : 'flat'}>
                {delta > 0 ? '+' : ''}
                {delta.toFixed(2)} cm / {POLL_INTERVAL_MS / 1000}s
              </span>
              <em className={delta > 0 ? 'tag tag--warn' : 'tag'}>
                {delta > 0 ? 'RISING' : 'STEADY'}
              </em>
            </div>

            <div className="gauges">
              <GaugeRing
                label="LEVEL"
                display={level === null ? '--' : level.toFixed(1)}
                unit="cm"
                pct={level === null ? 0 : level / 150}
                tone="accent"
              />
              <GaugeRing
                label="RATE"
                display={Math.abs(delta).toFixed(1)}
                unit="cm"
                pct={Math.abs(delta) / 20}
                tone={delta > 0 ? 'danger' : 'accent'}
              />
              <GaugeRing
                label="RISK IDX"
                display={
                  level === null ? '--' : Math.round((level / LEVEL_CRITICAL_CM) * 100)
                }
                unit="%"
                pct={level === null ? 0 : level / LEVEL_CRITICAL_CM}
                tone={level !== null && level >= LEVEL_CRITICAL_CM ? 'danger' : 'accent'}
              />
            </div>

            <Waveform points={history} />
          </Panel>

          <Panel title="SENSOR NETWORK STATUS" icon={Satellite} meta="SIMULATED">
            <ul className="nodes">
              {SENSOR_NODES.map((n) => (
                <li key={n.id} className={`node node--${n.status}`}>
                  <span className="node__dot" />
                  <span className="node__id">{n.id}</span>
                  <span className="node__site">{n.site}</span>
                  <span className="node__link">
                    <span className="node__lte">4G</span>
                    <SignalBars strength={n.bars} />
                    <em>{n.latencyMs}ms</em>
                  </span>
                </li>
              ))}
            </ul>
            <p className="panel__foot">
              Node identifiers, latency and signal figures are placeholders — no
              endpoint supplies them.
            </p>
          </Panel>
        </div>

        {/* ===== CENTER: map + commands ===== */}
        <div className="cmd__col cmd__col--center">
          <Panel
            title="MAIN PANEL · SURGE RADIUS"
            icon={Radar}
            meta={isFlood ? 'HAZARD ZONE ACTIVE' : 'STANDBY'}
            grow
          >
            <div className="map-slot">
              <MapView isFlood={isFlood} />
              <div className="map-hud">
                <span>
                  <Crosshair size={12} /> 80.7718°E 7.8731°N
                </span>
                <span className={online ? 'hud-ok' : 'hud-bad'}>
                  {online ? 'UPLINK OK' : 'UPLINK LOST'}
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="ADVANCED COMMAND" icon={Siren} meta="NO BACKEND WIRED">
            <div className="commands">
              {COMMANDS.map(({ id, label, Icon, tone }) => (
                <button
                  key={id}
                  type="button"
                  className={`cmdbtn cmdbtn--${tone}`}
                  onClick={() => runCommand(label)}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <p className="panel__foot">
              Buttons log to the activity feed only. They do not call any
              endpoint, and no alert, UAV or siren is actually actuated.
            </p>
          </Panel>
        </div>

        {/* ===== RIGHT: feeds, resources, log ===== */}
        <div className="cmd__col">
          <Panel title="LIVE UAV & FIELD SENSOR FEEDS" icon={Camera} meta="SIMULATED">
            <div className="feeds">
              {UAV_FEEDS.map((f) => (
                <div key={f.id} className={`feed feed--${f.mode}`}>
                  <span className="feed__cross" />
                  <span className="feed__id">{f.id}</span>
                  <span className="feed__label">{f.label}</span>
                  <span className={f.airborne ? 'feed__state ok' : 'feed__state off'}>
                    {f.airborne ? 'AIRBORNE' : 'GROUNDED'}
                  </span>
                  <Thermometer size={11} className="feed__icon" />
                </div>
              ))}
            </div>
            <p className="panel__foot">
              Placeholder boxes. No video feed is connected to this dashboard.
            </p>
          </Panel>

          <Panel title="RESOURCE & EVACUATION" icon={Truck} meta="SIMULATED">
            <ul className="resources">
              {RESOURCES.map((r) => {
                const Icon = RESOURCE_ICONS[r.icon] ?? Truck;
                const pct = Math.round((r.value / r.total) * 100);
                return (
                  <li key={r.label} className="resource">
                    <Icon size={13} className="resource__icon" />
                    <span className="resource__label">{r.label}</span>
                    <span className="resource__value">
                      {r.value}
                      <em>/{r.total}</em>
                    </span>
                    <span className="resource__bar">
                      <i style={{ width: `${pct}%` }} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="TACTICAL ACTIVITY LOG" icon={Clock} meta="LIVE" grow>
            <div className="term">
              {log.length === 0 ? (
                <p className="term__line term__line--dim">
                  Awaiting first telemetry frame…
                </p>
              ) : (
                log.map((e) => (
                  <p key={e.id} className={`term__line term__line--${e.tone}`}>
                    <span className="term__stamp">[{e.stamp}]</span> {e.text}
                  </p>
                ))
              )}
            </div>
            <p className="panel__foot">
              Real client-side events: observed status transitions and local
              button presses.
            </p>
          </Panel>
        </div>
      </div>

      {/* ---------- FOOTER ---------- */}
      <footer className="cmd__footer">
        <span>
          <Radio size={12} /> POLL {POLL_INTERVAL_MS}ms
        </span>
        <span>
          <Gauge size={12} /> SOURCE: /api/status
        </span>
        <span>
          <Battery size={12} /> RESTART: ALWAYS
        </span>
        <span className={isFlood ? 'foot-alert' : 'foot-ok'}>
          <Signal size={12} /> {isFlood ? 'EMERGENCY MODE' : 'NOMINAL MODE'}
        </span>
      </footer>
    </div>
  );
}
