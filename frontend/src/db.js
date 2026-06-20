import { db } from './firebase';
import { doc, getDoc, setDoc, collection, addDoc, deleteDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';

// In-memory cache to avoid redundant Firestore reads within the same session
const _cache = {};
function memGet(k) { return _cache[k]; }
function memSet(k, v) { _cache[k] = v; }
function memDel(k) { delete _cache[k]; }

/**
 * Gets the user profile. Attempts to query Firestore first,
 * then falls back to localStorage if Firestore fails or is empty.
 */
export async function getUserProfile(uid) {
  // 1. memory cache (instant)
  const mem = memGet(`profile_${uid}`);
  if (mem) return mem;

  // 2. localStorage (sync, ~0ms)
  const saved = localStorage.getItem(`ecopulse_profile_${uid}`);
  if (saved) {
    const parsed = JSON.parse(saved);
    memSet(`profile_${uid}`, parsed);
    // refresh from Firestore in background — don't block
    getDoc(doc(db, 'users', uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        localStorage.setItem(`ecopulse_profile_${uid}`, JSON.stringify(d));
        memSet(`profile_${uid}`, d);
      }
    }).catch(() => {});
    return parsed;
  }

  // 3. Firestore (first visit)
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const d = snap.data();
      localStorage.setItem(`ecopulse_profile_${uid}`, JSON.stringify(d));
      memSet(`profile_${uid}`, d);
      return d;
    }
  } catch (err) {
    console.warn('Firestore getUserProfile failed:', err.message);
  }
  return null;
}

/**
 * Saves or updates user profile. Always writes to localStorage
 * first, and attempts to sync with Firestore in the background.
 */
export async function setUserProfile(uid, data) {
  const key = `ecopulse_profile_${uid}`;
  const current = JSON.parse(localStorage.getItem(key) || '{}');
  const merged = { ...current, ...data };
  localStorage.setItem(key, JSON.stringify(merged));
  memSet(`profile_${uid}`, merged);
  // Firestore write in background
  setDoc(doc(db, 'users', uid), data, { merge: true }).catch(e => console.warn('Firestore setUserProfile:', e.message));
  return merged;
}

/**
 * Gets the last 7 log entries. Attempts to query Firestore,
 * falls back to localStorage on failure.
 */
export async function getUserEntries(uid) {
  const key = `ecopulse_entries_${uid}`;

  // 1. localStorage immediately (fast)
  const saved = localStorage.getItem(key);
  const localEntries = saved ? JSON.parse(saved).sort((a,b) => new Date(b.date||0)-new Date(a.date||0)) : null;
  if (localEntries && localEntries.length > 0) {
    // refresh from Firestore in background
    _fetchFirestoreEntries(uid).then(fe => {
      if (fe.length > 0) localStorage.setItem(key, JSON.stringify(fe));
    }).catch(() => {});
    return localEntries;
  }

  // 2. Firestore (first visit / cache miss)
  const fe = await _fetchFirestoreEntries(uid);
  if (fe.length > 0) localStorage.setItem(key, JSON.stringify(fe));
  return fe;
}

async function _fetchFirestoreEntries(uid) {
  try {
    const q = query(collection(db, 'users', uid, 'entries'), orderBy('timestamp','desc'), limit(7));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => new Date(b.date||0)-new Date(a.date||0));
  } catch { return []; }
}

/**
 * Adds an activity log entry. Saves to localStorage and Firestore.
 */
export async function addUserEntry(uid, entry) {
  const key = `ecopulse_entries_${uid}`;
  const newEntry = { ...entry, date: entry.date || new Date().toISOString(), timestamp: Date.now() };

  // Write localStorage synchronously
  const saved = localStorage.getItem(key);
  const entries = saved ? JSON.parse(saved) : [];
  entries.unshift(newEntry);
  localStorage.setItem(key, JSON.stringify(entries.slice(0, 50)));
  memDel(`entries_${uid}`); // invalidate memory cache

  // Firestore in background — capture the doc ID so we can delete later
  addDoc(collection(db, 'users', uid, 'entries'), {
    ...entry,
    date: newEntry.date,
    timestamp: new Date(),
  }).then(ref => {
    // Patch the localStorage entry with the real Firestore doc ID
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = current.findIndex(e => e.timestamp === newEntry.timestamp);
    if (idx !== -1) {
      current[idx].id = ref.id;
      localStorage.setItem(key, JSON.stringify(current));
    }
  }).catch(e => console.warn('Firestore addUserEntry:', e.message));

  return newEntry;
}

/**
 * Deletes a log entry by timestamp (local ID) or Firestore doc ID.
 * Updates both localStorage and Firestore.
 */
export async function deleteUserEntry(uid, entry) {
  const key = `ecopulse_entries_${uid}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    const entries = JSON.parse(saved);
    const filtered = entries.filter(e =>
      // match by Firestore id OR by local timestamp
      !(e.id && entry.id && e.id === entry.id) &&
      !(e.timestamp === entry.timestamp)
    );
    localStorage.setItem(key, JSON.stringify(filtered));
    memDel(`entries_${uid}`);
  }

  // Delete from Firestore if we have the doc ID
  if (entry.id) {
    deleteDoc(doc(db, 'users', uid, 'entries', entry.id))
      .catch(e => console.warn('Firestore deleteUserEntry:', e.message));
  }
}
