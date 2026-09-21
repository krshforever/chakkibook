/**
 * Chakkibook Real-Time Mandi Market Price Feed Service
 * Surfaces live regional mandi rates (Agmarknet feed simulation) and recommends
 * optimal grinding / pressing rate adjustments.
 */

const mockMandiData = {
  Gehun: { modalPrice: 2450, unit: '₹/Quintal', trend: 'up', market: 'Alwar Regional Mandi', changePercent: '+2.4%' },
  Bajra: { modalPrice: 2200, unit: '₹/Quintal', trend: 'stable', market: 'Bharatpur Mandi', changePercent: '0.0%' },
  Makka: { modalPrice: 2150, unit: '₹/Quintal', trend: 'down', market: 'Jaipur Grain Mandi', changePercent: '-1.1%' },
  Sarson: { modalPrice: 5650, unit: '₹/Quintal', trend: 'up', market: 'Kota Oilseed Mandi', changePercent: '+3.8%' }
};

export function fetchMandiPrices(grainType = 'Gehun') {
  const normalizedKey = 
    grainType.toLowerCase().includes('gehun') ? 'Gehun' :
    grainType.toLowerCase().includes('bajra') ? 'Bajra' :
    grainType.toLowerCase().includes('makka') ? 'Makka' :
    grainType.toLowerCase().includes('sarson') ? 'Sarson' : 'Gehun';

  const data = mockMandiData[normalizedKey] || mockMandiData['Gehun'];

  return {
    grainType: normalizedKey,
    modalPrice: data.modalPrice,
    unit: data.unit,
    trend: data.trend,
    market: data.market,
    changePercent: data.changePercent,
    lastUpdated: 'Aaj Subah 8:00 AM'
  };
}

export function recommendOptimalRate(grainType, currentShopRate = 4) {
  const mandi = fetchMandiPrices(grainType);

  if (mandi.trend === 'up' && currentShopRate < 4.5) {
    return {
      recommendation: 'Increase Rate Recommendation',
      suggestedRate: 4.5,
      reason: `${mandi.market} me ${mandi.grainType} ka rate ₹${mandi.modalPrice}/quintal (${mandi.changePercent}) badha hai. Pisai rate ₹4.5/kg kar sakte hain.`
    };
  }

  return {
    recommendation: 'Current Rate Optimal',
    suggestedRate: currentShopRate,
    reason: `Aapka current rate ₹${currentShopRate}/kg mandi rate (₹${mandi.modalPrice}/Qtl) ke anusar bilkul sahi hai.`
  };
}
