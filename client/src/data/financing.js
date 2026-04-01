export const financingPlans = [
  {
    id: "plan-18mo",
    name: "18 Months Same as Cash",
    description: "No interest if paid in full within 18 months",
    apr: 0,
    months: 18,
    deferredInterest: true,
    minAmount: 1000,
    tag: "Most Popular"
  },
  {
    id: "plan-60mo",
    name: "6.99% APR for 10 Years",
    description: "Fixed low-rate monthly payments over 10 years",
    apr: 6.99,
    months: 120,
    deferredInterest: false,
    minAmount: 2500,
    tag: null
  },
  {
    id: "plan-120mo",
    name: "120 Month Extended",
    description: "Lowest monthly payment option — 10 year term",
    apr: 12.99,
    months: 120,
    deferredInterest: false,
    minAmount: 5000,
    tag: "Lowest Payment"
  }
];
