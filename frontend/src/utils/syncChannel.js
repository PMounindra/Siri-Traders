/**
 * syncChannel.js — Real-time cross-tab & cross-component sync bus.
 *
 * Ensures that changes made in the Admin dashboard (product edits, new offers,
 * coupon updates, delivery zone changes, etc.) immediately reflect in the
 * storefront, and customer actions (new orders, reviews) immediately reflect
 * in the Admin dashboard without requiring a manual page refresh.
 */

const CHANNEL_NAME = 'siri_traders_sync_channel';

export const SYNC_EVENTS = {
  PRODUCTS_CHANGED: 'PRODUCTS_CHANGED',
  SITE_DATA_CHANGED: 'SITE_DATA_CHANGED',
  ORDER_PLACED: 'ORDER_PLACED',
  ORDERS_CHANGED: 'ORDERS_CHANGED',
  INVENTORY_CHANGED: 'INVENTORY_CHANGED',
  REVIEWS_CHANGED: 'REVIEWS_CHANGED',
  REFRESH_ALL: 'REFRESH_ALL',
};

let channel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel initialization fallback:', e);
}

/**
 * Broadcast an event to all open tabs and the current window
 */
export function broadcastSync(type, payload = {}) {
  const message = { type, payload, timestamp: Date.now() };

  // 1. Send via BroadcastChannel to other browser tabs
  if (channel) {
    try {
      channel.postMessage(message);
    } catch (err) {
      console.warn('BroadcastChannel postMessage error:', err);
    }
  }

  // 2. Dispatch local DOM custom event for same-window / same-tab listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('siri-sync-event', { detail: message }));

    // 3. Fallback localStorage ping for older browser storage events
    try {
      localStorage.setItem('siri_sync_ping', JSON.stringify({ type, timestamp: Date.now() }));
    } catch {
      // ignore quota / private mode errors
    }
  }
}

/**
 * Subscribe to sync events
 * @param {string|string[]} eventTypes - Single event type or array of event types (or '*' for all)
 * @param {function} callback - Callback function receiving ({ type, payload, timestamp })
 * @returns {function} Unsubscribe function
 */
export function subscribeSync(eventTypes, callback) {
  if (typeof window === 'undefined') return () => {};

  const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
  const listenAll = types.includes('*');

  const handler = (msg) => {
    if (!msg || !msg.type) return;
    if (listenAll || types.includes(msg.type)) {
      callback(msg);
    }
  };

  // 1. Listen to BroadcastChannel (from other tabs)
  const bcListener = (e) => {
    handler(e.data);
  };
  if (channel) {
    channel.addEventListener('message', bcListener);
  }

  // 2. Listen to local custom event (same tab)
  const localListener = (e) => {
    handler(e.detail);
  };
  window.addEventListener('siri-sync-event', localListener);

  // 3. Listen to storage event (fallback from other tabs)
  const storageListener = (e) => {
    if (e.key === 'siri_sync_ping' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        handler(parsed);
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', storageListener);

  // Return cleaner
  return () => {
    if (channel) {
      channel.removeEventListener('message', bcListener);
    }
    window.removeEventListener('siri-sync-event', localListener);
    window.removeEventListener('storage', storageListener);
  };
}
