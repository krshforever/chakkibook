/**
 * Shop bootstrap.
 *
 * Every sign-in — Google or phone OTP — funnels through here. It answers one
 * question for the caller: does this identity already have a shop, or do we
 * need to ask the operator to name it?
 *
 * Shop identity is deliberately stable across providers where possible:
 *
 *   phone → `shop_<10 digits>`   — switching from OTP to Google keeps the shop
 *   google → `shop_<email>`      — email is stable, uid is not portable
 *
 * The caller must handle `needsShopData: true` by collecting a shop name and
 * owner name, then calling `createShopForUser`. Doing that inside an auth
 * callback would block `onAuthStateChanged`, which fires before the user has
 * had any chance to type anything.
 */

/**
 * Injectable Firestore bindings.
 *
 * `shopBootstrap` needs these five functions. Defaulting them to the real
 * module keeps the call sites clean, but injecting them is what makes the
 * shop-resolution logic testable without a live database — ES module exports
 * are read-only getters, so there is no way to stub them after import.
 */
let db = {
  findShopByPhone: findShopByPhone_,
  findShopByEmail: findShopByEmail_,
  getShopDoc: getShopDoc_,
  createShopDoc: createShopDoc_,
  addMemberToFirestore: addMemberToFirestore_
};

function findShopByPhone_() { return firestoreRef.findShopByPhone; }
function findShopByEmail_() { return firestoreRef.findShopByEmail; }
function getShopDoc_() { return firestoreRef.getShopDoc; }
function createShopDoc_() { return firestoreRef.createShopDoc; }
function addMemberToFirestore_() { return firestoreRef.addMemberToFirestore; }

import * as firestoreRef from './firestore';

/** Test seam: replace the Firestore functions with fakes. */
export function __setDeps(overrides) {
  db = { ...db, ...overrides };
  return db;
}

/** Test seam: restore the real Firestore functions. */
export function __resetDeps() {
  db = {
    findShopByPhone: findShopByPhone_,
    findShopByEmail: findShopByEmail_,
    getShopDoc: getShopDoc_,
    createShopDoc: createShopDoc_,
    addMemberToFirestore: addMemberToFirestore_
  };
}

const DEFAULT_RATES = {
  pisai: 4,
  grainRates: { gehun: 4, bajra: 4.5, makka: 4.5, chana: 5.5, multigrain: 5 },
  kadda: { gehun: 1, bajra: 1, makka: 1.25, chana: 1.5, multigrain: 1.25 },
  kaddaPer: 40
};

const DEFAULT_SPELLAR = { pirai: 12, khari: 35 };

/** Stable shop id for a Firebase user, independent of which provider they used. */
export function shopIdForUser(user) {
  if (!user) return null;
  const phone = user.phoneNumber || (user.email ? user.email.split('@')[0] : '');
  const digits = String(phone || '').replace(/\D/g, '').slice(-10);
  if (digits.length === 10) return `shop_${digits}`;
  if (user.email) return `shop_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  return `shop_${user.uid}`;
}

/** @returns {Promise<{shopId: string|null, exists: boolean, needsShopData: boolean}>} */
export async function resolveShopForUser(user) {
  if (!user) return { shopId: null, exists: false, needsShopData: true };

  const phoneDigits = String(user.phoneNumber || '').replace(/\D/g, '').slice(-10);
  const shopId = shopIdForUser(user);

  // Fast path: the canonical doc for this identity already exists.
  if (shopId) {
    try {
      const doc = await db.getShopDoc(shopId);
      if (doc) return { shopId, exists: true, needsShopData: false };
    } catch (err) {
      console.warn('resolveShopForUser getShopDoc:', err);
    }
  }

  // Slower paths, for a user whose shop was created under a different phone
  // or email than the one they signed in with.
  let found = null;
  if (phoneDigits.length === 10) found = await db.findShopByPhone(phoneDigits);
  if (!found && user.email) found = await db.findShopByEmail(user.email);
  if (found) return { shopId: found, exists: true, needsShopData: false };

  return { shopId, exists: false, needsShopData: true };
}

/**
 * Create the shop document for a freshly-verified identity and register the
 * owner as its first member. Idempotent by shop id.
 */
export async function createShopForUser(user, { shopName, ownerName }) {
  const shopId = shopIdForUser(user);
  if (!shopId) throw new Error('Cannot resolve a shop id for this user');

  const phoneDigits = String(user.phoneNumber || '').replace(/\D/g, '').slice(-10);
  const shopData = {
    id: shopId,
    name: shopName || 'Meri Chakki',
    ownerName: ownerName || user.displayName || 'Bhaiya',
    ownerPhone: phoneDigits,
    ownerEmail: user.email || '',
    ownerId: user.uid,
    address: 'Main Market Road',
    chakkiRates: DEFAULT_RATES,
    spellarRates: DEFAULT_SPELLAR,
    smsSettings: { enabled: true, onDropOff: true, onDone: true, onPickedUp: true },
    aiEnabled: true
  };

  await db.createShopDoc(shopId, shopData);
  await db.addMemberToFirestore(shopId, {
    uid: user.uid,
    phone: phoneDigits,
    email: user.email || '',
    name: shopData.ownerName,
    role: 'owner'
  });

  return shopId;
}
