/**
 * Bins service — owns all bin-scanning API calls.
 */
import { api } from '../api';

/**
 * POST /bins/scan-report — resident reports a bin by scanning its QR code.
 * Returns { bin: { name, street, eco_reward }, ... }
 */
export async function reportBinScan(qrPayload) {
  return api.post('/bins/scan-report', { qr_payload: qrPayload });
}

/**
 * POST /bins/collection-confirm — collector confirms a bin has been collected.
 * Returns { bin_id, resident_name, eco_awarded, volume_liters, ... }
 */
export async function confirmBinCollection(qrPayload) {
  return api.post('/bins/collection-confirm', { qr_payload: qrPayload });
}

/**
 * GET /bins?status=FULL&barangay=X — fetches bins assigned for collection.
 * Used by collector home and route screens.
 *
 * Normalizes the API response to the shape collector screens expect:
 *   { id, name, street, barangay, status, latitude, longitude,
 *     reportedBy (from scan_logs join), timeReported, tierName }
 *
 * @param {string} [barangay] - optional filter by barangay
 * @param {string} [status]   - defaults to 'FULL'; pass null to fetch all statuses
 */
export async function fetchCollectorBins({ barangay = null, status = 'FULL' } = {}) {
  const params = new URLSearchParams();
  if (status)   params.append('status',   status);
  if (barangay) params.append('barangay', barangay);

  const query = params.toString() ? `?${params.toString()}` : '';
  const data  = await api.get(`/bins${query}`);

  return (data.bins || []).map((b) => ({
    id:           b.id,
    name:         b.name,
    street:       b.street        ?? '',
    barangay:     b.barangay      ?? '',
    status:       (b.status || 'EMPTY').toLowerCase(),
    latitude:     b.latitude      ?? null,
    longitude:    b.longitude     ?? null,
    tierName:     b.tier_name     ?? null,
    ecoReward:    b.eco_reward    ?? 0,
    // reporter info not yet enriched by the backend — shown as '—' until
    // a dedicated /bins/route endpoint is added that joins scan_logs
    reportedBy:   null,
    timeReported: null,
  }));
}

/**
 * GET /bins — fetches bins for the resident home map.
 * Returns bins with real latitude/longitude for MapCard rendering.
 *
 * @param {{ barangay?: string }} [opts]
 * @returns {Promise<Array<{ id, name, street, barangay, status, latitude, longitude }>>}
 */
export async function fetchBinsMap({ barangay } = {}) {
  const params = barangay ? `?barangay=${encodeURIComponent(barangay)}` : '';
  const data   = await api.get(`/bins${params}`);
  return (data.bins || []).map((b) => ({
    id:        b.id,
    name:      b.name,
    street:    b.street    ?? '',
    barangay:  b.barangay  ?? '',
    status:    b.status    ?? 'EMPTY',
    latitude:  b.latitude  != null ? Number(b.latitude)  : null,
    longitude: b.longitude != null ? Number(b.longitude) : null,
  }));
}
