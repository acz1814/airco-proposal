// Estimate-scoped sessionStorage utility.
// Every key is prefixed with the active estimate id so state cannot bleed
// between different customer estimates.

const ACTIVE_KEY = 'airco_active_estimate';

// One-time purge of any unscoped legacy keys left over from before the
// estimate-scoped storage refactor. Anything that does not begin with "est-"
// (the estimate id prefix) and is not the active-estimate pointer is dropped.
export function cleanupLegacyKeys() {
  try {
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (!k) continue;
      if (k === ACTIVE_KEY) continue;
      if (k.startsWith('est-')) continue;
      toRemove.push(k);
    }
    toRemove.forEach(k => sessionStorage.removeItem(k));
  } catch {}
}

export function getEstimateId() {
  try {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    // Match /proposal/<id>(/...) and /tech/estimate/<id>
    const m = path.match(/\/(?:proposal|tech\/estimate)\/([^/?#]+)/);
    if (m && m[1] && m[1] !== 'new') return m[1];
  } catch {}
  try {
    const active = sessionStorage.getItem(ACTIVE_KEY);
    if (active) return active;
  } catch {}
  return null;
}

function scopedKey(key, eid) {
  const id = eid || getEstimateId();
  if (!id) return null;
  return `${id}_${key}`;
}

export function setItem(key, value) {
  try {
    const k = scopedKey(key);
    if (!k) return;
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    sessionStorage.setItem(k, payload);
  } catch {}
}

export function getItem(key) {
  try {
    const k = scopedKey(key);
    if (!k) return null;
    return sessionStorage.getItem(k);
  } catch { return null; }
}

export function getJSON(key, fallback = null) {
  const raw = getItem(key);
  if (raw == null) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

export function removeItem(key) {
  try {
    const k = scopedKey(key);
    if (!k) return;
    sessionStorage.removeItem(k);
  } catch {}
}

export function clearEstimate(estimateId) {
  try {
    const id = estimateId || getEstimateId();
    if (!id) return;
    const prefix = `${id}_`;
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
    toRemove.forEach(k => sessionStorage.removeItem(k));
  } catch {}
}

export function setActiveEstimate(estimateId) {
  try {
    if (!estimateId) return;
    sessionStorage.setItem(ACTIVE_KEY, estimateId);
  } catch {}
}

export function getActiveEstimate() {
  try { return sessionStorage.getItem(ACTIVE_KEY); } catch { return null; }
}

// Migrate data from one estimate id (e.g. temporary "est-new-...") to another
export function migrateEstimate(fromId, toId) {
  try {
    if (!fromId || !toId || fromId === toId) return;
    const prefix = `${fromId}_`;
    const moves = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(prefix)) moves.push(k);
    }
    moves.forEach(k => {
      const suffix = k.slice(prefix.length);
      const val = sessionStorage.getItem(k);
      if (val != null) sessionStorage.setItem(`${toId}_${suffix}`, val);
      sessionStorage.removeItem(k);
    });
  } catch {}
}
