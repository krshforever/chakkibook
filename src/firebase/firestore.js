import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';

// Collection references helpers
export const getShopRef = (shopId) => doc(db, 'shops', shopId);
export const getBorisCollection = (shopId) => collection(db, 'shops', shopId, 'boris');
export const getCustomersCollection = (shopId) => collection(db, 'shops', shopId, 'customers');
export const getMembersCollection = (shopId) => collection(db, 'shops', shopId, 'members');
export const getInventoryCollection = (shopId) => collection(db, 'shops', shopId, 'inventory');
export const getStockEntriesCollection = (shopId) => collection(db, 'shops', shopId, 'stockEntries');

// Real-time snapshot listeners
export const subscribeToBoris = (shopId, callback) => {
  const q = query(getBorisCollection(shopId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const boris = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(boris);
  }, (err) => console.warn('Boris listener error:', err));
};

export const subscribeToCustomers = (shopId, callback) => {
  const q = query(getCustomersCollection(shopId), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(customers);
  }, (err) => console.warn('Customers listener error:', err));
};

export const subscribeToMembers = (shopId, callback) => {
  return onSnapshot(getMembersCollection(shopId), (snapshot) => {
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(members);
  }, (err) => console.warn('Members listener error:', err));
};

export const subscribeToInventory = (shopId, callback) => {
  return onSnapshot(getInventoryCollection(shopId), (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  }, (err) => console.warn('Inventory listener error:', err));
};

export const subscribeToShopConfig = (shopId, callback) => {
  const configDocRef = doc(db, 'shops', shopId, 'config', 'settings');
  return onSnapshot(configDocRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    }
  }, (err) => console.warn('Config listener error:', err));
};

// Shop management
export const createShopDoc = async (shopId, shopData) => {
  const shopRef = getShopRef(shopId);
  await setDoc(shopRef, {
    ...shopData,
    createdAt: serverTimestamp()
  }, { merge: true });
};

export const getShopDoc = async (shopId) => {
  const shopRef = getShopRef(shopId);
  const snap = await getDoc(shopRef);
  return snap.exists() ? snap.data() : null;
};

// NOTE: there is deliberately no findShopByPhone / findShopByEmail here.
//
// Both were a collection-wide query on `shops` filtered by ownerPhone or
// ownerEmail. That query can only succeed if the security rules let any signed
// in user list every shop — which is exactly the hole that made production
// readable and writable by any self-registered account.
//
// A shop id is already a pure function of the identity (`shopIdForUser`), so
// the lookup is unnecessary: compute the id, then read that one document. If
// it is absent or not ours, the rules deny it and the caller is asked to create
// the shop. Cross-tenant reads are not part of the design.

// CRUD Operations
export const addBoriToFirestore = async (shopId, boriData) => {
  const col = getBorisCollection(shopId);
  const docRef = await addDoc(col, {
    ...boriData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateBoriInFirestore = async (shopId, boriId, updates) => {
  const boriRef = doc(db, 'shops', shopId, 'boris', boriId);
  await updateDoc(boriRef, updates);
};

export const deleteBoriInFirestore = async (shopId, boriId) => {
  const boriRef = doc(db, 'shops', shopId, 'boris', boriId);
  await deleteDoc(boriRef);
};

export const addCustomerToFirestore = async (shopId, customerData) => {
  const col = getCustomersCollection(shopId);
  const docRef = await addDoc(col, {
    ...customerData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateCustomerInFirestore = async (shopId, customerId, updates) => {
  const ref = doc(db, 'shops', shopId, 'customers', customerId);
  await updateDoc(ref, updates);
};

export const saveShopConfigToFirestore = async (shopId, configData) => {
  const configRef = doc(db, 'shops', shopId, 'config', 'settings');
  await setDoc(configRef, configData, { merge: true });
};

// Members are addressed by uid when we have one, because the security rules
// authorise on `members/{request.auth.uid}`. Passing `uid` therefore writes the
// record the rules will actually look for. A teammate who has not signed up yet
// has no uid, so that call falls back to an invitation record with a generated
// id (it grants nobody access until the owner links it to a real uid).
export const addMemberToFirestore = async (shopId, memberData) => {
  const payload = { ...memberData, addedAt: serverTimestamp() };
  if (memberData?.uid) {
    const ref = doc(db, 'shops', shopId, 'members', memberData.uid);
    await setDoc(ref, payload, { merge: true });
    return memberData.uid;
  }
  const docRef = await addDoc(getMembersCollection(shopId), payload);
  return docRef.id;
};

export const removeMemberFromFirestore = async (shopId, memberId) => {
  const memberRef = doc(db, 'shops', shopId, 'members', memberId);
  await deleteDoc(memberRef);
};

export const updateInventoryItemInFirestore = async (shopId, itemId, updates) => {
  const itemRef = doc(db, 'shops', shopId, 'inventory', itemId);
  await setDoc(itemRef, updates, { merge: true });
};
