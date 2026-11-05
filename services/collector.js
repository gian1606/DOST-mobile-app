/**
 * Collector service — owns all garbage-collector API calls.
 * Screens import these functions instead of calling api.get/post directly.
 */
import { api } from '../api';

/**
 * POST /collector/reports — submits an incident/issue report for a route.
 * @param {object} params
 * @param {string}      params.issueType       - Selected issue type label
 * @param {string|null} params.notes           - Optional additional notes
 * @param {number}      params.stopsCompleted
 * @param {number}      params.stopsTotal
 */
export async function submitCollectorReport({ issueType, notes, stopsCompleted, stopsTotal }) {
  return api.post('/collector/reports', {
    issue_type:      issueType,
    notes:           notes ?? null,
    stops_completed: stopsCompleted,
    stops_total:     stopsTotal,
  });
}

/**
 * GET /collector/collections — returns the authenticated collector's bin
 * collection history from scan_logs.
 *
 * @param {'all'|'today'|'week'} [filter='all']
 * @returns {Promise<Array<{
 *   id, binId, binName, street, barangay,
 *   collectedAt, volumeL, ecoAwarded, status
 * }>>}
 */
export async function fetchCollectorCollections(filter = 'all') {
  return api.get(`/collector/collections?filter=${filter}`);
}
