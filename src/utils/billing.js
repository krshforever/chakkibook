/**
 * Pure Billing Calculation Utilities for Atta Chakki & Oil Expeller
 */

export function calculateKaddaDeduction(weight = 0, kaddaRate = 1.25, kaddaPer = 40) {
  const weightNum = Number(weight) || 0;
  if (!weightNum || !kaddaPer) return 0;
  return Number(((weightNum / kaddaPer) * kaddaRate).toFixed(2));
}

export function calculateExpectedOutput(weight = 0, kaddaDeduction = 0) {
  const weightNum = Number(weight) || 0;
  return Math.max(0, Number((weightNum - kaddaDeduction).toFixed(2)));
}

export function calculateTotalBill(weight = 0, rate = 4) {
  const weightNum = Number(weight) || 0;
  const rateNum = Number(rate) || 0;
  return Number((weightNum * rateNum).toFixed(2));
}
