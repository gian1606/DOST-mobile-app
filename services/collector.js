/**
 * Collector service — owns all garbage-collector API calls.
 */
import { api } from '../api';

/**
 * POST /collector-reports — submits an incident/issue report for a route.
 * @param {object} params
 * @param {string} params.issueType    - Selected issue type label
 * @param {string|null} params.notes   - Optional additional notes
 * @param {number} params.stopsCompleted
 * @param {number} params.stopsTotal
 */
export async function submitCollectorReport({ issueType, notes, stopsCompleted, stopsTotal }) {
  return api.post('/collector-reports', {
    issue_type:      issueType,
    notes:           notes ?? null,
    stops_completed: stopsCompleted,
    stops_total:     stopsTotal,
  });
}
