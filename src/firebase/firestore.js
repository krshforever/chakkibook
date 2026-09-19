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
  where,
  getDocs,
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

// Check if phone belongs to any existing shop member
export const findShopByPhone = async (phone) => {
  try {
    const memberQuery = query(collection(db, 'shops'), where('ownerPhone', '==', phone));
    const snap = await getDocs(memberQuery);
    if (!snap.empty) {
      return snap.docs[0].id;
    }
  } catch (err) {
    console.warn('findShopByPhone error:', err);
  }
  return null;
};

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

export const addMemberToFirestore = async (shopId, memberData) => {
  const col = getMembersCollection(shopId);
  const docRef = await addDoc(col, {
    ...memberData,
    addedAt: serverTimestamp()
  });
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
