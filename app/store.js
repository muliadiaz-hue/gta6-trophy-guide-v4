// Save state for the Leonida Platinum tracker: one localStorage entry holding
// which trophies are earned (by exact name, with the date earned), the PSN
// progress counters, and the spoiler setting. Nothing leaves the browser.
export const STORAGE_KEY = 'gta6-trophy-guide-v1';

function blankState() {
  return { version: 1, earned: {}, progress: {}, spoiler: true };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return blankState();
    return {
      version: 1,
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      progress: parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {},
      spoiler: parsed.spoiler !== false,
    };
  } catch {
    return blankState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function isEarned(state, trophy) {
  return Object.prototype.hasOwnProperty.call(state.earned, trophy.name);
}

export function toggleEarned(state, trophy) {
  if (isEarned(state, trophy)) {
    delete state.earned[trophy.name];
  } else {
    state.earned[trophy.name] = new Date().toISOString().slice(0, 10);
  }
  saveState(state);
}

export function progressOf(state, trophy) {
  const n = state.progress[trophy.name];
  return Number.isFinite(n) ? Math.max(0, Math.min(trophy.psn_count || 0, n)) : 0;
}

export function bumpProgress(state, trophy, delta) {
  if (!trophy.psn_count) return;
  state.progress[trophy.name] = progressOf(state, trophy) + delta;
  saveState(state);
}

export function earnedCount(state, trophies) {
  return trophies.filter((t) => isEarned(state, t)).length;
}

// Import a previously exported file: keep only names that exist in the 55,
// clamp every counter to its PSN target, and report what was recognised.
export function importState(state, trophies, data) {
  const known = new Map(trophies.map((t) => [t.name, t]));
  let keptEarned = 0;
  let keptProgress = 0;
  const incoming = data && typeof data === 'object' ? data : {};
  if (incoming.earned && typeof incoming.earned === 'object') {
    for (const [name, when] of Object.entries(incoming.earned)) {
      if (known.has(name)) {
        state.earned[name] = typeof when === 'string' ? when : new Date().toISOString().slice(0, 10);
        keptEarned += 1;
      }
    }
  }
  if (incoming.progress && typeof incoming.progress === 'object') {
    for (const [name, n] of Object.entries(incoming.progress)) {
      const trophy = known.get(name);
      if (trophy && trophy.psn_count && Number.isFinite(n)) {
        state.progress[name] = Math.max(0, Math.min(trophy.psn_count, n));
        keptProgress += 1;
      }
    }
  }
  if (typeof incoming.spoiler === 'boolean') state.spoiler = incoming.spoiler;
  saveState(state);
  return { keptEarned, keptProgress };
}

export function exportState(state) {
  return JSON.stringify(state, null, 2);
}
