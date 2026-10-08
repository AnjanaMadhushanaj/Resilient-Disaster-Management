/**
 * SIMULATED DATA — NOT FROM THE API, NOT MEASURED, NOT TRANSMITTED.
 *
 * The telemetry API (/api/status) returns exactly three fields:
 *   { status, waterLevel, updatedAt }
 *
 * Nothing in this file comes from that endpoint, from a real sensor node, a
 * UAV, a radio link, or a resource-tracking system. These are placeholder
 * values invented so the command-centre layout can be laid out and reviewed.
 *
 * The numbers here (latency in ms, signal strength, node IDs, unit counts) are
 * fabricated. Do not present them as instrumented output, and do not cite them
 * in the paper. Replace each export with a real data source — or delete the
 * panel that consumes it — before this is shown as anything other than a mockup.
 */

/** Signal strength is 1-4 bars. Status is one of: ok | warn | alert. */
export const SENSOR_NODES = [
  { id: 'NODE-04', site: 'Kelani Ganga upper', status: 'alert', bars: 1, latencyMs: 812 },
  { id: 'NODE-07', site: 'Ratnapura hillside', status: 'warn', bars: 2, latencyMs: 430 },
  { id: 'NODE-12', site: 'Kalu Ganga delta', status: 'ok', bars: 4, latencyMs: 96 },
  { id: 'NODE-15', site: 'Gin Ganga barrage', status: 'ok', bars: 3, latencyMs: 154 },
];

/** Thermal and optical feeds. `thermal` only changes the placeholder tint. */
export const UAV_FEEDS = [
  { id: 'UAV-01', label: 'THERMAL', mode: 'thermal', airborne: true },
  { id: 'UAV-02', label: 'OPTICAL', mode: 'optical', airborne: true },
  { id: 'UAV-03', label: 'THERMAL', mode: 'thermal', airborne: false },
];

export const RESOURCES = [
  { label: 'Evacuation zones open', value: 12, total: 18, icon: 'home' },
  { label: 'Relief camps active', value: 7, total: 9, icon: 'truck' },
  { label: 'Personnel deployed', value: 214, total: 300, icon: 'users' },
  { label: 'Shelter occupancy', value: 1380, total: 2500, icon: 'shield' },
];
