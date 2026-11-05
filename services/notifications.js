/**
 * Notifications service — owns all notification API calls.
 * Screens import these functions instead of calling api.get/post directly.
 */
import { api } from '../api';

/**
 * GET /notifications — returns the authenticated user's notifications.
 *
 * @param {{ limit?: number, unread?: boolean }} [opts]
 * @returns {Promise<{ notifications: Array, unreadCount: number }>}
 *
 * Each notification:
 *   { id, type, title, body, read, time }
 */
export async function fetchNotifications({ limit = 50, unread = false } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (unread) params.append('unread', 'true');
  return api.get(`/notifications?${params.toString()}`);
}

/**
 * PUT /notifications/:id/read — marks a single notification as read.
 * @param {string} notificationId
 */
export async function markNotificationRead(notificationId) {
  return api.put(`/notifications/${notificationId}/read`, {});
}

/**
 * PUT /notifications/read-all — marks all unread notifications as read.
 */
export async function markAllNotificationsRead() {
  return api.put('/notifications/read-all', {});
}
