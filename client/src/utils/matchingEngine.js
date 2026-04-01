import { pricebook } from '../data/pricebook.js';

export function matchOptions(tonnage, systemType = "split", fuelType = "electric") {
  const active = pricebook.filter(option => option.active);

  const tonMultipliers = {
    1.5: 0.72,
    2:   0.82,
    2.5: 0.91,
    3:   1.00,
    3.5: 1.09,
    4:   1.18,
    5:   1.35
  };

  const multiplier = tonMultipliers[parseFloat(tonnage)] || 1.00;

  return active.map(option => ({
    ...option,
    tonnage: parseFloat(tonnage),
    totalPrice: Math.round(option.totalPrice * multiplier / 100) * 100,
    monthlyPayment: Math.round(option.monthlyPayment * multiplier)
  }));
}

export function calculateMonthlyPayment(principal, apr, months) {
  if (apr === 0) {
    return Math.ceil(principal / months);
  }
  const monthlyRate = apr / 100 / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months))
                  / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.ceil(payment);
}

export function calculateFinalTotal(basePrice, addonPrices = [], rebate = 0) {
  const addonTotal = addonPrices.reduce((sum, p) => sum + p, 0);
  return basePrice + addonTotal - rebate;
}
