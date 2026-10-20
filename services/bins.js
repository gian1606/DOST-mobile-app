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
 * Returns { bin_id, resident_name, eco_awarded, ... }
 */
export async function confirmBinCollection(qrPayload) {
  return api.post('/bins/collection-confirm', { qr_payload: qrPayload });
}
