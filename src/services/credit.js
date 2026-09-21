/**
 * Chakkibook Customer Credit Scoring Engine
 * Computes credit trust score (0-100), tier classification (Gold, Silver, Bronze),
 * and financial risk recommendation for rural flour mill customers.
 */

export function calculateCreditScore(customer = {}, boris = []) {
  const customerBoris = boris.filter(
    (b) => b.customerId === customer.id || b.customerName === customer.name
  );

  let score = 100;
  const balance = Number(customer.balance || 0);

  // Deduct for outstanding balance threshold
  if (balance > 2000) {
    score -= 35;
  } else if (balance > 1000) {
    score -= 20;
  } else if (balance > 500) {
    score -= 10;
  }

  // Deduct for long uncollected credit orders
  const uncollectedCredits = customerBoris.filter((b) => b.paymentMode === 'credit' && b.status === 'pending');
  score -= uncollectedCredits.length * 5;

  // Bonus for regular visits & volume history
  const totalVolumeKg = customerBoris.reduce((sum, b) => sum + (Number(b.inputWeight) || 0), 0);
  if (totalVolumeKg > 200) score += 10;
  if (customerBoris.length >= 5) score += 5;

  // Clamp score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));

  let tier = 'gold';
  let tierLabel = 'Gold Customer (Vishwasniya)';
  let color = 'hsl(142 60% 28%)';
  let bg = 'hsl(142 50% 94%)';
  let recommendation = 'Credit Safe (Udhar De Sakte Hain)';

  if (finalScore < 60) {
    tier = 'bronze';
    tierLabel = 'Bronze Customer (High Risk)';
    color = 'hsl(12 85% 38%)';
    bg = 'hsl(12 85% 95%)';
    recommendation = 'Cash Only (Sirf Nokad Bhugtan Lijiye)';
  } else if (finalScore < 80) {
    tier = 'silver';
    tierLabel = 'Silver Customer (Moderate Risk)';
    color = 'hsl(32 100% 30%)';
    bg = 'hsl(38 100% 94%)';
    recommendation = 'Credit With Caution (Limit ₹500 Max)';
  }

  return {
    score: finalScore,
    tier,
    tierLabel,
    color,
    bg,
    recommendation,
    totalVolumeKg,
    orderCount: customerBoris.length
  };
}
