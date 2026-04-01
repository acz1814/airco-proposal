export const pricebook = [
  {
    id: "opt-good",
    tier: "Good",
    label: "Good",
    systemName: "Comfort Series 16",
    indoor: "AirCo AC-AH-36-V1",
    outdoor: "AirCo AC-HP-36-16",
    tonnage: 3,
    efficiency: "16 SEER2",
    warranty: { parts: "5 Year", labor: "1 Year", compressor: "5 Year" },
    totalPrice: 7800,
    monthlyPayment: 129,
    keyBenefits: [
      "Reliable single-stage cooling",
      "Standard energy efficiency",
      "5-year parts warranty"
    ],
    features: ["Single-stage compressor", "R-410A refrigerant", "Standard filter system"],
    rebates: 0,
    active: true
  },
  {
    id: "opt-better",
    tier: "Better",
    label: "Better",
    systemName: "Performance Series 18",
    indoor: "AirCo AC-AH-36-V2",
    outdoor: "AirCo AC-HP-36-18",
    tonnage: 3,
    efficiency: "18 SEER2",
    warranty: { parts: "10 Year", labor: "2 Year", compressor: "10 Year" },
    totalPrice: 9900,
    monthlyPayment: 164,
    keyBenefits: [
      "Two-stage cooling for better comfort",
      "Improved energy savings vs. Good",
      "10-year parts & compressor warranty"
    ],
    features: ["Two-stage compressor", "R-410A refrigerant", "Media filter included"],
    rebates: 250,
    active: true
  },
  {
    id: "opt-best",
    tier: "Best",
    label: "Best",
    systemName: "Elite Series 20",
    indoor: "AirCo AC-AH-36-V3",
    outdoor: "AirCo AC-HP-36-20",
    tonnage: 3,
    efficiency: "20 SEER2",
    warranty: { parts: "10 Year", labor: "5 Year", compressor: "Lifetime" },
    totalPrice: 12400,
    monthlyPayment: 206,
    recommended: true,
    keyBenefits: [
      "Variable-speed precision comfort",
      "Up to 30% energy savings vs. Good",
      "Lifetime compressor warranty",
      "Qualifies for $500 utility rebate"
    ],
    features: ["Variable-speed inverter compressor", "R-32 refrigerant", "iQ Drive technology", "Smart thermostat compatible"],
    rebates: 500,
    active: true
  },
  {
    id: "opt-premium",
    tier: "Premium",
    label: "Premium",
    systemName: "Prestige Series 22 + Air Purification",
    indoor: "AirCo AC-AH-36-V4",
    outdoor: "AirCo AC-HP-36-22",
    tonnage: 3,
    efficiency: "22 SEER2",
    warranty: { parts: "10 Year", labor: "10 Year", compressor: "Lifetime" },
    totalPrice: 16200,
    monthlyPayment: 269,
    keyBenefits: [
      "Top-of-line variable-speed system",
      "Integrated whole-home air purification",
      "Wi-Fi smart controls included",
      "Qualifies for $500 + $300 utility rebates",
      "10-year labor warranty"
    ],
    features: ["Ultra-variable inverter", "R-32 refrigerant", "Built-in UV air purifier", "Smart thermostat included", "Wi-Fi enabled controls"],
    rebates: 800,
    active: true
  }
];
