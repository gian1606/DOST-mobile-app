/**
 * MRF service — owns all MRF facility and buyer reservation API calls.
 * Screens import these functions instead of calling api.get/post directly.
 */
import { api } from '../api';

/**
 * GET /mrf/facilities — returns active MRF facilities.
 * Available to all authenticated roles (used by resident, MRF worker, and buyer maps).
 *
 * @param {{ status?: string }} [opts]
 * @returns {Promise<Array<{
 *   id, name, barangay, address, latitude, longitude,
 *   status, capacityKg, startingBid, buyoutPrice,
 *   startingBidRaw, buyoutPriceRaw,
 *   currentHighestBid, currentHighestBidRaw
 * }>>}
 */
export async function fetchMRFFacilities({ status } = {}) {
  const params = status ? `?status=${encodeURIComponent(status)}` : '';
  const data   = await api.get(`/mrf/facilities${params}`);
  return data.facilities || [];
}

/**
 * GET /mrf/reservations — returns the buyer's own bid/reservation history.
 * Requires mrf_buyer role.
 *
 * @returns {Promise<Array<{
 *   id, facilityId, mrfName, barangay, material, weightKg,
 *   bidAmount, bidAmountRaw, status, dateTime, bids
 * }>>}
 */
export async function fetchMyReservations() {
  const data = await api.get('/mrf/reservations');
  return data.reservations || [];
}

/**
 * POST /mrf/reservations — buyer places a bid on a full MRF.
 * Requires mrf_buyer role.
 *
 * @param {{ facilityId: string, bidAmount: number, material?: string, weightKg?: number }}
 * @returns {Promise<{ message: string, reservation: object }>}
 */
export async function placeBid({ facilityId, bidAmount, material, weightKg }) {
  return api.post('/mrf/reservations', {
    facilityId,
    bidAmount,
    material:  material  ?? null,
    weightKg:  weightKg  ?? null,
  });
}
