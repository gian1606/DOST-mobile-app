/**
 * Eco service — owns all ECO token / rewards / waste API calls.
 * Screens import these functions instead of calling api.get/post directly.
 */
import { api } from '../api';

/** GET /eco/balance — returns the numeric balance for the logged-in user. */
export async function fetchBalance() {
  const data = await api.get('/eco/balance');
  return Number(data.balance);
}

/**
 * GET /eco/transactions — returns earned and redeemed transactions,
 * normalized to the shape TransactionRow expects.
 */
export async function fetchTransactions() {
  const data = await api.get('/eco/transactions');

  const fmt = (d) =>
    new Date(d).toLocaleString('en-PH', {
      month: 'numeric', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const earned = (data.earned || []).map((t) => ({
    id:          t.id,
    type:        'earned',
    title:       t.weight_kg ? `${t.title} · ${t.weight_kg} kg` : t.title,
    description: t.tx_hash ? `tx: ${t.tx_hash.slice(0, 16)}...` : '',
    dateTime:    fmt(t.created_at),
    amount:      t.amount,
  }));

  const redeemed = (data.redeemed || []).map((t) => ({
    id:          t.id,
    type:        'redeemed',
    title:       t.title,
    description: t.tx_hash ? `tx: ${t.tx_hash.slice(0, 16)}...` : '',
    dateTime:    fmt(t.created_at),
    amount:      t.amount,
  }));

  return { earned, redeemed };
}

/**
 * GET /eco/rewards — returns the rewards catalogue.
 * Normalizes eco_cost → tokenCost so RewardCard doesn't need to know the API shape.
 */
export async function fetchRewards() {
  const data = await api.get('/eco/rewards');
  return data.map((r) => ({ ...r, tokenCost: r.eco_cost }));
}

/**
 * POST /eco/rewards/:id/redeem — Step 1 of two-step redemption.
 * Creates a pending redemption row. Balance is NOT deducted here.
 * Returns { redemptionId, rewardName, ecoCost }
 */
export async function redeemReward(rewardId) {
  return api.post(`/eco/rewards/${rewardId}/redeem`, {});
}

/**
 * GET /eco/redemptions/pending — returns the resident's unclaimed pending redemptions.
 * Used by the Rewards screen to show "Ongoing" on cards with an in-flight QR.
 * Each item: { redemptionId, rewardId, rewardName, ecoCost, redeemedAt }
 */
export async function fetchPendingRedemptions() {
  const data = await api.get('/eco/redemptions/pending');
  return data.map((r) => ({
    redemptionId: r.redemption_id,
    rewardId:     r.reward_id,
    rewardName:   r.reward_name,
    ecoCost:      r.eco_cost,
    redeemedAt:   r.redeemed_at,
  }));
}

/**
 * GET /eco/waste-types — returns the list of waste types an MRF worker can select.
 */
export async function fetchWasteTypes() {
  return api.get('/eco/waste-types');
}

/**
 * POST /eco/issue — issues ECO tokens from an MRF worker to a resident.
 * Returns { ecoAwarded, residentName, txHash }.
 */
export async function issueEco({ qrValue, wasteTypeId, weightKg }) {
  return api.post('/eco/issue', { qrValue, wasteTypeId, weightKg });
}

/**
 * POST /eco/rewards/claim — Step 2 of two-step redemption.
 * MRF worker scans a BESMART-REWARD-<uuid> QR → deducts balance + burns on-chain.
 * Returns { redemptionId, rewardName, ecoCost, residentName, txHash }
 */
export async function claimRedemption(qrValue) {
  return api.post('/eco/rewards/claim', { qrValue });
}

/**
 * GET /eco/mrf-transactions — returns MRF token issuance history.
 * Normalizes snake_case API fields to camelCase for MRFTransactionRow.
 */
export async function fetchMRFTransactions(filter = 'all') {
  const data = await api.get(`/eco/mrf-transactions?filter=${filter}`);

  return data.map((t) => ({
    id:            t.id,
    residentName:  t.resident_name,
    residentId:    t.resident_id,
    wasteType:     t.waste_type,
    weight:        `${t.weight_kg} kg`,
    tokensAwarded: t.eco_awarded,
    txHash:        t.tx_hash,
    dateTime:      new Date(t.created_at).toLocaleString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
  }));
}
