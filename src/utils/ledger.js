/**
 * Pure Ledger Utilities for Customer Dues, Balances, and Migration
 */

export function calculateTotalDues(customers = []) {
  if (!Array.isArray(customers)) return 0;
  return customers.reduce((sum, c) => sum + (Number(c?.balance || 0) > 0 ? Number(c.balance) : 0), 0);
}

export function filterDebtors(customers = [], villageFilter = 'all', searchQuery = '') {
  if (!Array.isArray(customers)) return [];
  const query = searchQuery.trim().toLowerCase();
  
  return customers.filter((c) => {
    if (!c) return false;
    const matchesSearch = !query || c.name?.toLowerCase().includes(query) || c.phone?.includes(query) || c.village?.toLowerCase().includes(query);
    const matchesV = villageFilter === 'all' || (c.village || '').trim().toLowerCase() === villageFilter.trim().toLowerCase();
    return matchesSearch && matchesV;
  });
}

export function migrateLedgerV2(borisList = [], customersList = []) {
  if (!Array.isArray(borisList)) return [];
  return borisList.map((b) => {
    const tx_kind = (b.grainType?.toLowerCase() === 'jama payment' || b.type === 'payment' || b.tx_kind === 'payment')
      ? 'payment'
      : (b.type === 'pirai' ? 'pirai' : (b.type === 'khari_sale' ? 'khari' : 'pisai'));

    let customerId = b.customerId;
    let needsReview = Boolean(b.needsReview);

    if (!customerId || customerId === 'c_temp') {
      const bName = (b.customerName || '').trim().toLowerCase();
      const hits = (customersList || []).filter(c => (c.name || '').trim().toLowerCase() === bName);
      if (hits.length === 1) {
        customerId = hits[0].id;
        needsReview = false;
      } else {
        needsReview = true;
      }
    } else {
      needsReview = false;
    }

    return {
      ...b,
      tx_kind,
      customerId,
      needsReview
    };
  });
}
