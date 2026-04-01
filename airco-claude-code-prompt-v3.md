# AirCo Estimate & Proposal System
## Claude Code Build Prompt — v3.0
### Axis Op Internal • April 2026

---

## YOUR JOB

Build a complete, working web application: the **AirCo Estimate & Proposal System**.

This is a web-based HVAC estimate and proposal tool. It has two user-facing experiences:
1. **Technician / Comfort Advisor** — builds and sends estimates
2. **Homeowner** — receives a link, compares options, selects a system, and pays or applies for financing

Build everything as a **Phase 1 demo** using **mock data only**. No real GHL calls. No real Stripe charges. No real financing APIs. Everything should look and feel completely real, but run entirely on hardcoded mock data.

---

## TECH STACK

Use exactly this stack. Do not deviate.

| Layer | What It Does |
|---|---|
| React + Vite | Frontend — all UI, routing, state |
| Tailwind CSS | Styling — all colors, spacing, layout |
| Recharts | Any charts or data visualizations |
| React Router | Page routing |
| Node.js + Express | Backend server — handles API calls, mock data, Stripe/GHL simulation |
| Mock Data files | Hardcoded realistic HVAC data — no real APIs needed |
| GitHub | Source of truth for all code |
| Replit | Hosts the live app |

---

## AIRCO BRAND & BUSINESS INFORMATION

Use this everywhere in the app — navigation, footers, confirmation screens, terms, contact info.

```
Company Name:    AiRCO Mechanical
Tagline:         "Comfort in Simplicity"
Services:        HVAC · Electrical · Plumbing
Phone:           512-454-COOL (2665)
Website:         www.aircoaustin.com
Address:         1000 South IH-35, Round Rock, TX 78681
AC License:      TACLA51950C
Plumbing:        M37961
Electrical:      TECL35427
Regulator:       Texas Department of Licensing and Regulation
```

### Logo

The AiRCO logo file will be placed at:
```
client/public/airco-logo.png
```

Use it as an `<img>` tag wherever the logo appears. Do NOT recreate it in text or SVG. Reference it like this:
```jsx
<img src="/airco-logo.png" alt="AiRCO Mechanical" className="h-10" />
```

Logo appears on:
- TechnicianDashboard top nav (left side)
- ProposalComparison top of page
- Checkout financing card
- Confirmation page
- All email/SMS mock previews

### IAQ Diagram

The IAQ system diagram file will be placed at:
```
client/public/airco-iaq-diagram.png
```

Use it in the Add-Ons page inside the "Air Quality" category section header — display it as an illustrative image above the air quality add-on cards:
```jsx
<img src="/airco-iaq-diagram.png" alt="Indoor Air Quality System" className="w-full max-w-2xl mx-auto my-4 rounded-xl" />
```

### Financing Disclosure (use verbatim in Checkout and Terms)

```
*With approved credit. Monthly payment may vary slightly.
We do not accept cash. Check or Money Orders must be used for cash discount.
```

### Labor Warranty Disclosure (use in Option Detail warranty section)

```
Any labor warranty period past 12 months from the day of installation completion
requires a minimum of one annual preventative maintenance performed by AiRCO.
The first annual maintenance visit must be performed within 24 months of installation.
Failure to meet this requirement will result in cancellation of your Labor Warranty.
```

### Performance Guarantees (display on ProposalComparison page below option cards)

Show both guarantees as a trust-building banner:

**10-YEAR "NO LEMON" HEATING GUARANTEE**
> Should your heat exchanger fail within the first ten (10) years of installation, we will replace the entire furnace at no cost. Requires reasonable access to equipment.

**5-YEAR "NO LEMON" COOLING GUARANTEE**
> Should your cooling system or heat pump compressor fail two (2) times within the first five (5) years of installation, we will replace the entire unit at no cost. Requires reasonable access to equipment.

---

## PROJECT STRUCTURE

Create the following folder structure:

```
airco-proposal/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TechnicianDashboard.jsx
│   │   │   ├── EstimateBuilder.jsx
│   │   │   ├── ProposalComparison.jsx
│   │   │   ├── OptionDetail.jsx
│   │   │   ├── AddOns.jsx
│   │   │   ├── Checkout.jsx
│   │   │   └── Confirmation.jsx
│   │   ├── components/
│   │   │   ├── OptionCard.jsx
│   │   │   ├── AddOnItem.jsx
│   │   │   ├── FinancingBadge.jsx
│   │   │   ├── InstallInclusions.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── NavBar.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── data/
│   │   │   ├── pricebook.js
│   │   │   ├── addons.js
│   │   │   ├── financing.js
│   │   │   └── mockEstimates.js
│   │   ├── utils/
│   │   │   ├── matchingEngine.js
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── server/
│   ├── index.js               # Express server
│   ├── routes/
│   │   ├── estimates.js
│   │   ├── ghl.js             # Mock GHL sync
│   │   └── stripe.js          # Mock Stripe
│   └── data/
│       └── mockDb.js          # In-memory estimate store
├── .env.example
├── .gitignore
└── package.json               # Root — runs both client and server
```

---

## MOCK DATA

### Pricebook (`client/src/data/pricebook.js`)

Create a realistic pricebook with these 4 option tiers for a 3-ton residential system:

```javascript
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
```

### Add-Ons (`client/src/data/addons.js`)

```javascript
export const addons = [
  {
    id: "addon-thermostat",
    category: "Smart Home",
    name: "Ecobee SmartThermostat Premium",
    description: "Wi-Fi enabled, voice control, remote access, 3-year warranty",
    price: 295,
    monthlyAddition: 5,
    popular: true
  },
  {
    id: "addon-uv",
    category: "Air Quality",
    name: "UV Air Purifier",
    description: "Kills 99.9% of bacteria, viruses, and mold in your air handler",
    price: 495,
    monthlyAddition: 8,
    popular: true
  },
  {
    id: "addon-media-filter",
    category: "Air Quality",
    name: "4\" Media Air Cleaner",
    description: "MERV-11 whole-home filtration, lasts 12 months vs. standard 1-month filters",
    price: 275,
    monthlyAddition: 5,
    popular: false
  },
  {
    id: "addon-surge",
    category: "Protection",
    name: "Whole-System Surge Protector",
    description: "Protects the entire HVAC system from voltage spikes and lightning",
    price: 195,
    monthlyAddition: 3,
    popular: false
  },
  {
    id: "addon-maintenance",
    category: "Maintenance",
    name: "AirCo 3-Year Maintenance Plan",
    description: "3 tune-ups per year, priority scheduling, 15% discount on repairs",
    price: 399,
    monthlyAddition: 11,
    popular: true
  },
  {
    id: "addon-duct-seal",
    category: "Efficiency",
    name: "Duct Sealing (Aeroseal)",
    description: "Seals leaky ducts from the inside — average 20% efficiency improvement",
    price: 850,
    monthlyAddition: 14,
    popular: false
  }
];
```

### Financing Plans (`client/src/data/financing.js`)

```javascript
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
```

### Mock Estimates (`client/src/data/mockEstimates.js`)

```javascript
export const mockEstimates = [
  {
    id: "est-001",
    status: "accepted",
    createdAt: "2026-03-28T10:14:00Z",
    sentAt: "2026-03-28T10:22:00Z",
    viewedAt: "2026-03-28T11:05:00Z",
    acceptedAt: "2026-03-28T11:34:00Z",
    homeowner: {
      firstName: "Sarah",
      lastName: "Nguyen",
      phone: "512-555-0191",
      email: "sarah.nguyen@email.com",
      address: "4821 Lakewood Dr",
      city: "Austin",
      state: "TX",
      zip: "78704"
    },
    jobDetails: {
      tonnage: 3,
      systemType: "split",
      fuelType: "electric",
      notes: "Existing system is 14 years old. Attic unit."
    },
    selectedOptionId: "opt-best",
    selectedAddons: ["addon-thermostat", "addon-maintenance"],
    subtotal: 12400,
    addonTotal: 694,
    rebate: 500,
    finalTotal: 12594,
    paymentMethod: "financing",
    paymentStatus: "financing_approved",
    paymentId: "mock_pi_001",
    financingPlanId: "plan-18mo",
    monthlyPayment: 206,
    ghlContactId: "mock_GHL_001",
    ghlOpportunityId: "mock_OPP_001"
  },
  {
    id: "est-002",
    status: "sent",
    createdAt: "2026-03-31T14:30:00Z",
    sentAt: "2026-03-31T14:45:00Z",
    viewedAt: "2026-03-31T16:10:00Z",
    acceptedAt: null,
    homeowner: {
      firstName: "Marcus",
      lastName: "Torres",
      phone: "512-555-0247",
      email: "m.torres@gmail.com",
      address: "2209 Rundberg Ln",
      city: "Austin",
      state: "TX",
      zip: "78758"
    },
    jobDetails: {
      tonnage: 2.5,
      systemType: "split",
      fuelType: "electric",
      notes: "Homeowner requested heat pump option if available."
    },
    selectedOptionId: null,
    selectedAddons: [],
    subtotal: null,
    addonTotal: 0,
    rebate: 0,
    finalTotal: null,
    paymentMethod: null,
    paymentStatus: "payment_pending",
    paymentId: null,
    financingPlanId: null,
    monthlyPayment: null,
    ghlContactId: "mock_GHL_002",
    ghlOpportunityId: "mock_OPP_002"
  },
  {
    id: "est-003",
    status: "draft",
    createdAt: "2026-04-01T09:05:00Z",
    sentAt: null,
    viewedAt: null,
    acceptedAt: null,
    homeowner: {
      firstName: "Linda",
      lastName: "Castillo",
      phone: "512-555-0388",
      email: "lcastillo@yahoo.com",
      address: "908 Shoal Creek Blvd",
      city: "Austin",
      state: "TX",
      zip: "78701"
    },
    jobDetails: {
      tonnage: 4,
      systemType: "package",
      fuelType: "gas",
      notes: ""
    },
    selectedOptionId: null,
    selectedAddons: [],
    subtotal: null,
    addonTotal: 0,
    rebate: 0,
    finalTotal: null,
    paymentMethod: null,
    paymentStatus: "payment_pending",
    paymentId: null,
    financingPlanId: null,
    monthlyPayment: null,
    ghlContactId: null,
    ghlOpportunityId: null
  },
  {
    id: "est-004",
    status: "opened",
    createdAt: "2026-03-29T08:00:00Z",
    sentAt: "2026-03-29T08:15:00Z",
    viewedAt: "2026-03-30T19:42:00Z",
    acceptedAt: null,
    homeowner: {
      firstName: "Derek",
      lastName: "Washington",
      phone: "512-555-0512",
      email: "derek.w@outlook.com",
      address: "1133 E 51st St",
      city: "Austin",
      state: "TX",
      zip: "78723"
    },
    jobDetails: {
      tonnage: 3.5,
      systemType: "split",
      fuelType: "electric",
      notes: "Customer is comparing with another company."
    },
    selectedOptionId: null,
    selectedAddons: [],
    subtotal: null,
    addonTotal: 0,
    rebate: 0,
    finalTotal: null,
    paymentMethod: null,
    paymentStatus: "payment_pending",
    paymentId: null,
    financingPlanId: null,
    monthlyPayment: null,
    ghlContactId: "mock_GHL_004",
    ghlOpportunityId: "mock_OPP_004"
  },
  {
    id: "est-005",
    status: "declined",
    createdAt: "2026-03-25T11:00:00Z",
    sentAt: "2026-03-25T11:10:00Z",
    viewedAt: "2026-03-25T15:30:00Z",
    acceptedAt: null,
    homeowner: {
      firstName: "Patricia",
      lastName: "Kim",
      phone: "512-555-0633",
      email: "pkim@email.com",
      address: "3307 Speedway",
      city: "Austin",
      state: "TX",
      zip: "78705"
    },
    jobDetails: {
      tonnage: 2,
      systemType: "split",
      fuelType: "electric",
      notes: "Older home, 1960s construction."
    },
    selectedOptionId: null,
    selectedAddons: [],
    subtotal: null,
    addonTotal: 0,
    rebate: 0,
    finalTotal: null,
    paymentMethod: null,
    paymentStatus: "payment_pending",
    paymentId: null,
    financingPlanId: null,
    monthlyPayment: null,
    ghlContactId: "mock_GHL_005",
    ghlOpportunityId: "mock_OPP_005"
  },
  {
    id: "est-006",
    status: "accepted",
    createdAt: "2026-03-20T13:00:00Z",
    sentAt: "2026-03-20T13:20:00Z",
    viewedAt: "2026-03-20T18:00:00Z",
    acceptedAt: "2026-03-21T09:15:00Z",
    homeowner: {
      firstName: "James",
      lastName: "Okafor",
      phone: "512-555-0744",
      email: "jokafor@gmail.com",
      address: "6612 Burnet Rd",
      city: "Austin",
      state: "TX",
      zip: "78757"
    },
    jobDetails: {
      tonnage: 5,
      systemType: "split",
      fuelType: "electric",
      notes: "Large home, 2-story. Needs 5-ton system."
    },
    selectedOptionId: "opt-premium",
    selectedAddons: ["addon-thermostat", "addon-uv", "addon-surge"],
    subtotal: 16200,
    addonTotal: 985,
    rebate: 800,
    finalTotal: 16385,
    paymentMethod: "stripe",
    paymentStatus: "paid_in_full",
    paymentId: "mock_pi_006",
    financingPlanId: null,
    monthlyPayment: null,
    ghlContactId: "mock_GHL_006",
    ghlOpportunityId: "mock_OPP_006"
  }
];
```

---

## MATCHING ENGINE (`client/src/utils/matchingEngine.js`)

```javascript
import { pricebook } from '../data/pricebook.js';

/**
 * Returns 3-4 system options matched to the given job specs.
 * Always returns all active pricebook options — tonnage is used
 * to scale monthly payments since the demo pricebook is built on 3-ton base.
 */
export function matchOptions(tonnage, systemType = "split", fuelType = "electric") {
  const active = pricebook.filter(option => option.active);

  // Tonnage pricing multiplier — scale from base 3-ton pricing
  const tonMultipliers = {
    1.5: 0.72,
    2:   0.82,
    2.5: 0.91,
    3:   1.00,  // base
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

/**
 * Calculates monthly payment for a given principal, APR, and term.
 * Returns 0 for 0% APR (same-as-cash — divide total by months).
 */
export function calculateMonthlyPayment(principal, apr, months) {
  if (apr === 0) {
    return Math.ceil(principal / months);
  }
  const monthlyRate = apr / 100 / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months))
                  / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.ceil(payment);
}

/**
 * Returns the net total after rebates and addons.
 */
export function calculateFinalTotal(basePrice, addonPrices = [], rebate = 0) {
  const addonTotal = addonPrices.reduce((sum, p) => sum + p, 0);
  return basePrice + addonTotal - rebate;
}
```

## FORMATTERS (`client/src/utils/formatters.js`)

```javascript
/**
 * Format a number as US currency. e.g. 12400 → "$12,400"
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format monthly payment. e.g. 206 → "$206/mo"
 */
export function formatMonthly(amount) {
  return `${formatCurrency(amount)}/mo`;
}

/**
 * Format a date string to human-readable. e.g. "2026-03-28T10:14:00Z" → "Mar 28, 2026"
 */
export function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

/**
 * Format a date to relative time. e.g. "2 days ago", "Just now"
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Map estimate status to display label and Tailwind color classes.
 */
export function getStatusMeta(status) {
  const map = {
    draft:              { label: 'Draft',      bg: 'bg-gray-100',   text: 'text-gray-600'  },
    generated:          { label: 'Generated',  bg: 'bg-gray-100',   text: 'text-gray-600'  },
    sent:               { label: 'Sent',       bg: 'bg-blue-100',   text: 'text-blue-700'  },
    opened:             { label: 'Opened',     bg: 'bg-yellow-100', text: 'text-yellow-700'},
    explored:           { label: 'Exploring',  bg: 'bg-yellow-100', text: 'text-yellow-700'},
    option_selected:    { label: 'Interested', bg: 'bg-purple-100', text: 'text-purple-700'},
    financing_started:  { label: 'Financing',  bg: 'bg-indigo-100', text: 'text-indigo-700'},
    accepted:           { label: 'Accepted',   bg: 'bg-green-100',  text: 'text-green-700' },
    declined:           { label: 'Declined',   bg: 'bg-red-100',    text: 'text-red-600'   },
    expired:            { label: 'Expired',    bg: 'bg-gray-100',   text: 'text-gray-500'  },
  };
  return map[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-600' };
}

/**
 * Generate a unique estimate ID for new estimates.
 */
export function generateEstimateId() {
  return 'est-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Build the homeowner-facing proposal URL for a given estimate ID.
 */
export function buildProposalUrl(estimateId) {
  const base = import.meta.env.VITE_APP_URL || window.location.origin;
  return `${base}/proposal/${estimateId}`;
}
```

---

### Page 1: Technician Dashboard (`/tech`)

**Purpose:** The technician's home base. Shows recent estimates and quick access to create new ones.

**Layout:**
- Top nav: AirCo logo left, "New Estimate" blue button right
- Stats row: 4 cards — Estimates This Month, Accepted, Pending, Avg. Job Value
- Table: Recent Estimates — columns: Homeowner Name, Address, Status badge, Total, Created date, Action button

**Mock Data:** Show 6-8 estimates in various statuses using mockEstimates data

**Status badges:**
- draft → gray
- sent → blue
- opened → yellow
- accepted → green
- declined → red

**Actions:**
- "New Estimate" button → navigates to `/tech/estimate/new`
- Row "View" button → navigates to `/tech/estimate/:id`

---

### Page 2: Estimate Builder (`/tech/estimate/new`)

**Purpose:** Technician inputs job specs. System auto-generates options.

**Layout — 2 column on desktop, single column mobile:**

Left panel — Input Form:
- Section: Homeowner Info
  - First Name, Last Name (required)
  - Phone, Email (required)
  - Address, City, State, Zip
- Section: Job Details
  - Tonnage selector: 1.5 / 2 / 2.5 / 3 / 3.5 / 4 / 5 ton (dropdown, required)
  - System Type: Central Split / Package Unit / Heat Pump (radio buttons)
  - Fuel Type: Electric / Gas (radio buttons)
  - Notes (textarea, optional)
- "Generate Options" button — primary blue, full width

Right panel — Generated Options Preview:
- Empty state: "Fill in job details and click Generate Options"
- After generation: shows 4 OptionCard components stacked
- Each card has: Edit button (dummy), Mark Recommended toggle
- Below cards: "Send to Homeowner" button (blue, full width)
  - Sends email + SMS (mock) and updates estimate status to `sent`
  - Shows a success toast: "Estimate sent to [name] via email and SMS"

---

### Page 3: Proposal Comparison (`/proposal/:estimateId`)

**Purpose:** The homeowner-facing page. Clean, premium, mobile-first. This is the money page.

**This page has no password. It is publicly accessible via the estimate link.**

**Layout:**

Top section:
- AiRCO logo (`/airco-logo.png`) + tagline: "Comfort in Simplicity"
- Homeowner name greeting: "Hi Sarah, here are your options for 123 Main St."
- Subtext: "We've matched 4 systems to your home. Take your time — there's no rush."

Option Cards row (horizontal scroll on mobile, 4-column grid on desktop):
- Each OptionCard:
  - Tier badge (Good / Better / Best / Premium)
  - "Recommended" ribbon on the Best option
  - System name
  - Equipment pairing (indoor + outdoor unit names)
  - Efficiency badge (e.g., "20 SEER2")
  - Key benefits list (3 items max, checkmarks)
  - Warranty summary line
  - Rebate badge if applicable (e.g., "$500 Rebate Available")
  - Price: large bold — "Total Investment: $12,400"
  - Or as low as: "$206/month" in financing
  - "Learn More" → expands detail panel
  - "Select This System" CTA button

Below cards:
- Trust section: "What's Included With Every Installation" (InstallInclusions component)
- Financing teaser: "Most homeowners finance. See your options after selecting a system."

---

### Page 4: Option Detail (expandable panel or modal)

**Triggered by "Learn More" on any option card.**

Sections:
1. **System Overview** — 2-3 sentences explaining the system in plain English
2. **Equipment Specs** — table: Tonnage, SEER2, Refrigerant, Stage, Compressor type
3. **Comfort Explanation** — plain English: "This system runs at variable speed, which means..."
4. **Full Warranty** — breakdown: parts, labor, compressor
5. **What's Included** — installation checklist (permits, removal, startup, cleanup, code items)
6. **Rebates & Incentives** — show rebate amount and description if > 0
7. **Financing Options** — show all 3 financing plans with calculated payments
8. **Add-Ons Available** — 3 most popular addons with "Add" buttons

---

### Page 5: Add-Ons (`/proposal/:estimateId/addons`)

**Reached after homeowner clicks "Select This System"**

**Layout:**
- Top: "Upgrade Your System (Optional)" header
- Subheader: selected system name + base price shown
- Add-on cards grouped by category
- Each addon card:
  - Name, description
  - Price: "+$295"
  - Monthly addition: "+$5/mo"
  - "Popular Choice" badge if applicable
  - Toggle or "Add" / "Remove" button
- Running total sidebar (sticky on desktop): Selected System + each added addon + Updated Total + Updated Monthly
- Two CTAs: "Continue Without Upgrades" (ghost) + "Continue to Checkout" (blue primary)

---

### Page 6: Checkout (`/proposal/:estimateId/checkout`)

**Layout:**

Left: Order Summary
- Selected system name + tier
- Each selected addon
- Subtotal
- Rebate deduction (if applicable): "-$500"
- **Final Total** (large)

Right: Payment Options — two equal cards:

**Card 1: Apply for Financing**
- AiRCO logo (`/airco-logo.png`) + "Flexible Monthly Payments"
- Selected plan (default to 18-month same as cash)
- Plan selector dropdown (all 3 plans)
- Calculated monthly payment (based on final total)
- "Apply Now" button → shows mock approval screen after 2 seconds with green checkmark: "Pre-Approved! Monthly payment: $206/mo"

**Card 2: Pay Now**
- "Pay in Full or Leave a Deposit"
- Option 1: Pay in Full → shows final total → "Pay $12,400" Stripe button (mock)
- Option 2: Deposit Only → shows 10% of total → "Pay $1,240 Deposit" button (mock)
- Both trigger mock Stripe flow: loading 1.5s → "Payment Successful" green screen

**Below both cards:**
- Financing disclosure (verbatim): "*With approved credit. Monthly payment may vary slightly. We do not accept cash. Check or Money Orders must be used for cash discount."
- Terms acceptance checkbox: "I have read and accept the AiRCO Mechanical Service Agreement [View Terms]"
- Digital signature: simple text input "Type your full name to sign"
- "Complete & Schedule Installation" button (disabled until terms checked + name typed)

---

### Page 7: Confirmation (`/proposal/:estimateId/confirmation`)

**Layout:**
- Large green checkmark animation (CSS, not external library)
- "You're All Set, Sarah!" heading
- Summary: selected system, final price, payment method
- Next steps list:
  1. "You'll receive a confirmation email within 5 minutes"
  2. "Our scheduling team will call you within 24 hours"
  3. "Installation typically takes 4–6 hours"
- "Save Your Receipt" button (dummy)
- AiRCO contact footer: "Questions? Call 512-454-COOL (2665) or visit www.aircoaustin.com | 1000 South IH-35, Round Rock, TX 78681"
- License footer: "AC TACLA51950C | Plumbing M37961 | Electrical TECL35427 | Regulated by Texas Department of Licensing and Regulation"

---

## COMPONENTS — SPECS

### OptionCard (`components/OptionCard.jsx`)
Props: `option`, `isSelected`, `onSelect`, `onLearnMore`
- Renders full card from pricebook data
- Recommended ribbon: absolute positioned top-right, red diagonal banner
- Selected state: blue border, checkmark in top-right corner
- Hover state: slight shadow lift

### InstallInclusions (`components/InstallInclusions.jsx`)
Static component. Always shows:
- ✅ Permits pulled and filed
- ✅ Old equipment removal and disposal
- ✅ New equipment startup and testing
- ✅ All code-required safety items
- ✅ Full site cleanup
- ✅ Walk-through and system tutorial

### FinancingBadge (`components/FinancingBadge.jsx`)
Props: `monthlyPayment`
Shows: "As low as $206/mo" with a small info icon

### StatusBadge (`components/StatusBadge.jsx`)
Props: `status`
Maps status → color + label

### ProgressBar (`components/ProgressBar.jsx`)
Shows homeowner progress: Compare → Select → Customize → Checkout → Done
Highlights current step

---

## MOCK BACKEND (server/)

### Mock DB (`server/data/mockDb.js`)

```javascript
import { mockEstimates } from '../../client/src/data/mockEstimates.js';

// In-memory store — seeded from mock data on startup
let estimates = [...mockEstimates];

export const db = {
  // Return all estimates
  getAllEstimates() {
    return [...estimates];
  },

  // Return a single estimate by ID
  getEstimateById(id) {
    return estimates.find(e => e.id === id) || null;
  },

  // Create a new estimate — merges provided data with defaults
  createEstimate(data) {
    const newEstimate = {
      id: 'est-' + Date.now().toString(36),
      status: 'draft',
      createdAt: new Date().toISOString(),
      sentAt: null,
      viewedAt: null,
      acceptedAt: null,
      selectedOptionId: null,
      selectedAddons: [],
      subtotal: null,
      addonTotal: 0,
      rebate: 0,
      finalTotal: null,
      paymentMethod: null,
      paymentStatus: 'payment_pending',
      paymentId: null,
      financingPlanId: null,
      monthlyPayment: null,
      ghlContactId: null,
      ghlOpportunityId: null,
      ...data
    };
    estimates.push(newEstimate);
    return newEstimate;
  },

  // Update specific fields on an estimate
  updateEstimate(id, updates) {
    const idx = estimates.findIndex(e => e.id === id);
    if (idx === -1) return null;
    estimates[idx] = { ...estimates[idx], ...updates };
    return estimates[idx];
  },

  // Log an activity event (in-memory only for Phase 1)
  logActivity(estimateId, event, data = {}) {
    console.log(`[Activity] ${estimateId} | ${event}`, data);
    // Phase 2: persist to activity log table
  }
};
```

### Express Server (`server/index.js`)

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import estimateRoutes from './routes/estimates.js';
import stripeRoutes from './routes/stripe.js';
import ghlRoutes from './routes/ghl.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL || ''
  ].filter(Boolean)
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: process.env.USE_MOCK === 'true' ? 'mock' : 'live',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/estimates', estimateRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/ghl', ghlRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`AiRCO API running on port ${PORT} [${process.env.USE_MOCK === 'true' ? 'MOCK MODE' : 'LIVE MODE'}]`);
});
```

### Estimates Route (`server/routes/estimates.js`)

```javascript
import { Router } from 'express';
import { db } from '../data/mockDb.js';

const router = Router();

// GET /api/estimates — list all estimates
router.get('/', (req, res) => {
  const estimates = db.getAllEstimates();
  // Sort newest first
  estimates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ estimates, count: estimates.length });
});

// GET /api/estimates/:id — get single estimate
router.get('/:id', (req, res) => {
  const estimate = db.getEstimateById(req.params.id);
  if (!estimate) return res.status(404).json({ error: 'Estimate not found' });
  res.json({ estimate });
});

// POST /api/estimates — create new estimate
router.post('/', (req, res) => {
  const { homeowner, jobDetails } = req.body;
  if (!homeowner || !jobDetails) {
    return res.status(400).json({ error: 'homeowner and jobDetails are required' });
  }
  const estimate = db.createEstimate({ homeowner, jobDetails, status: 'draft' });
  db.logActivity(estimate.id, 'estimate_created');
  res.status(201).json({ estimate });
});

// PATCH /api/estimates/:id/status — update status only
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['draft','generated','sent','opened','explored','option_selected','financing_started','accepted','declined','expired'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Set timestamp fields automatically based on status transition
  const timestamps = {};
  if (status === 'sent')     timestamps.sentAt = new Date().toISOString();
  if (status === 'opened')   timestamps.viewedAt = new Date().toISOString();
  if (status === 'accepted') timestamps.acceptedAt = new Date().toISOString();

  const updated = db.updateEstimate(req.params.id, { status, ...timestamps });
  if (!updated) return res.status(404).json({ error: 'Estimate not found' });

  db.logActivity(req.params.id, `status_changed_to_${status}`);
  res.json({ estimate: updated });
});

// POST /api/estimates/:id/select — homeowner selects a system option
router.post('/:id/select', (req, res) => {
  const { optionId, addons = [] } = req.body;
  if (!optionId) return res.status(400).json({ error: 'optionId is required' });

  const updated = db.updateEstimate(req.params.id, {
    selectedOptionId: optionId,
    selectedAddons: addons,
    status: 'option_selected'
  });
  if (!updated) return res.status(404).json({ error: 'Estimate not found' });

  db.logActivity(req.params.id, 'option_selected', { optionId, addons });
  res.json({ estimate: updated });
});

// POST /api/estimates/:id/accept — homeowner completes checkout
router.post('/:id/accept', (req, res) => {
  const {
    selectedOptionId,
    selectedAddons,
    subtotal,
    addonTotal,
    rebate,
    finalTotal,
    paymentMethod,
    paymentStatus,
    paymentId,
    financingPlanId,
    monthlyPayment,
    signature
  } = req.body;

  const updated = db.updateEstimate(req.params.id, {
    selectedOptionId,
    selectedAddons,
    subtotal,
    addonTotal,
    rebate,
    finalTotal,
    paymentMethod,
    paymentStatus,
    paymentId,
    financingPlanId,
    monthlyPayment,
    signature,
    status: 'accepted',
    acceptedAt: new Date().toISOString()
  });

  if (!updated) return res.status(404).json({ error: 'Estimate not found' });
  db.logActivity(req.params.id, 'estimate_accepted', { paymentMethod, finalTotal });

  // Fire mock GHL sync on acceptance
  const mockGhlContactId = `mock_GHL_${req.params.id}`;
  const mockGhlOpportunityId = `mock_OPP_${req.params.id}`;
  db.updateEstimate(req.params.id, {
    ghlContactId: mockGhlContactId,
    ghlOpportunityId: mockGhlOpportunityId
  });

  res.json({
    estimate: db.getEstimateById(req.params.id),
    ghlSynced: true,
    ghlContactId: mockGhlContactId,
    ghlOpportunityId: mockGhlOpportunityId
  });
});

export default router;
```

### Stripe Route (`server/routes/stripe.js`)

```javascript
import { Router } from 'express';
import { db } from '../data/mockDb.js';

const router = Router();

// POST /api/stripe/checkout — mock Stripe payment
// Simulates both full payment and deposit scenarios
router.post('/checkout', (req, res) => {
  const { estimateId, amount, paymentType } = req.body;
  // paymentType: 'full' | 'deposit'

  if (!estimateId || !amount || !paymentType) {
    return res.status(400).json({ error: 'estimateId, amount, and paymentType are required' });
  }

  const estimate = db.getEstimateById(estimateId);
  if (!estimate) return res.status(404).json({ error: 'Estimate not found' });

  // Simulate a small random failure rate (5%) — makes the demo feel real
  if (Math.random() < 0.05) {
    db.logActivity(estimateId, 'payment_failed', { amount, paymentType });
    return res.status(402).json({
      success: false,
      error: 'payment_failed',
      message: 'Your card was declined. Please try a different card.'
    });
  }

  const paymentId = `mock_pi_${Date.now().toString(36)}`;
  const paymentStatus = paymentType === 'full' ? 'paid_in_full' : 'deposit_paid';

  db.updateEstimate(estimateId, {
    paymentId,
    paymentStatus,
    paymentMethod: 'stripe'
  });

  db.logActivity(estimateId, 'payment_completed', { paymentId, amount, paymentType });

  res.json({
    success: true,
    paymentId,
    paymentStatus,
    amount,
    paymentType,
    receiptUrl: `https://mock-stripe.aircoaustin.com/receipts/${paymentId}`,
    timestamp: new Date().toISOString()
  });
});

export default router;
```

### GHL Route (`server/routes/ghl.js`)

```javascript
import { Router } from 'express';
import { db } from '../data/mockDb.js';

const router = Router();

/**
 * All GHL routes are MOCK in Phase 1.
 * In Phase 2, replace the mock responses with real GHL REST API calls
 * using GHL_API_KEY and GHL_LOCATION_ID from environment variables.
 *
 * GHL Base URL: https://services.leadconnectorhq.com
 * Auth header: Authorization: Bearer {GHL_API_KEY}
 */

// POST /api/ghl/sync — sync estimate data to GHL contact + opportunity
router.post('/sync', (req, res) => {
  const { estimateId } = req.body;
  if (!estimateId) return res.status(400).json({ error: 'estimateId is required' });

  const estimate = db.getEstimateById(estimateId);
  if (!estimate) return res.status(404).json({ error: 'Estimate not found' });

  const mockContactId = estimate.ghlContactId || `mock_GHL_${estimateId}`;
  const mockOpportunityId = estimate.ghlOpportunityId || `mock_OPP_${estimateId}`;

  db.updateEstimate(estimateId, {
    ghlContactId: mockContactId,
    ghlOpportunityId: mockOpportunityId
  });

  db.logActivity(estimateId, 'ghl_synced', { mockContactId, mockOpportunityId });

  res.json({
    synced: true,
    contactId: mockContactId,
    opportunityId: mockOpportunityId,
    timestamp: new Date().toISOString()
  });
});

// POST /api/ghl/trigger — fire a GHL automation workflow trigger
// triggerName maps to a GHL custom webhook trigger on the sub-account
router.post('/trigger', (req, res) => {
  const { estimateId, triggerName, payload = {} } = req.body;

  /**
   * Supported trigger names and when they fire:
   *
   * estimate_sent          → fired when technician clicks "Send to Homeowner"
   * estimate_viewed        → fired when homeowner opens the proposal link
   * option_selected        → fired when homeowner clicks "Select This System"
   * financing_started      → fired when homeowner clicks "Apply Now" in checkout
   * payment_completed      → fired when payment or financing approval is done
   * estimate_accepted      → fired when homeowner completes full checkout
   * estimate_no_decision   → fired by a scheduled task if estimate expires (Phase 2)
   */

  const validTriggers = [
    'estimate_sent',
    'estimate_viewed',
    'option_selected',
    'financing_started',
    'payment_completed',
    'estimate_accepted',
    'estimate_no_decision'
  ];

  if (!validTriggers.includes(triggerName)) {
    return res.status(400).json({ error: `Unknown trigger: ${triggerName}` });
  }

  console.log(`[GHL Trigger] ${triggerName} | Estimate: ${estimateId}`, payload);
  db.logActivity(estimateId, `ghl_trigger_${triggerName}`, payload);

  // Phase 2: replace with real GHL webhook call:
  // await fetch(`https://services.leadconnectorhq.com/hooks/${WEBHOOK_ID}`, {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${process.env.GHL_API_KEY}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ estimateId, triggerName, ...payload })
  // });

  res.json({
    triggered: true,
    triggerName,
    estimateId,
    timestamp: new Date().toISOString()
  });
});

// POST /api/ghl/notify — send SMS or email via GHL (mock in Phase 1)
router.post('/notify', (req, res) => {
  const { estimateId, type, recipient, message } = req.body;
  // type: 'sms' | 'email'

  console.log(`[GHL Notify] ${type?.toUpperCase()} to ${recipient}: ${message}`);
  db.logActivity(estimateId, `notification_sent_${type}`, { recipient });

  res.json({
    sent: true,
    type,
    recipient,
    messageId: `mock_msg_${Date.now().toString(36)}`,
    timestamp: new Date().toISOString()
  });
});

export default router;
```

---

## ENVIRONMENT VARIABLES

`.env.example`:
```
USE_MOCK=true
DEMO_PASSWORD=airco2024
PORT=3001
VITE_API_URL=http://localhost:3001
```

---

## ROUTING (`App.jsx`)

```
/tech                           → TechnicianDashboard
/tech/estimate/new              → EstimateBuilder
/tech/estimate/:id              → EstimateBuilder (edit mode)
/proposal/:estimateId           → ProposalComparison (homeowner view)
/proposal/:estimateId/addons    → AddOns
/proposal/:estimateId/checkout  → Checkout
/proposal/:estimateId/confirm   → Confirmation
```

---

## DESIGN SYSTEM

### Colors
```
Primary Blue:    #1D4ED8   (buttons, CTAs, selected states)
Light Blue:      #EFF6FF   (card backgrounds, info sections)
Green:           #16A34A   (success, accepted, checkmarks)
Yellow:          #CA8A04   (pending, warnings)
Red:             #DC2626   (declined, errors)
Gray 900:        #111827   (primary text)
Gray 600:        #4B5563   (secondary text)
Gray 200:        #E5E7EB   (borders, dividers)
White:           #FFFFFF   (backgrounds)
```

### Typography
- Headings: font-bold, tracking-tight
- Body: font-normal, leading-relaxed
- Price display: text-3xl font-bold text-gray-900
- Monthly payment: text-lg font-semibold text-blue-700

### Spacing
- Page padding: px-6 py-8 (mobile), px-12 py-10 (desktop)
- Card padding: p-6
- Gap between cards: gap-4 (mobile), gap-6 (desktop)

### Cards
- rounded-2xl
- shadow-sm on default, shadow-lg on hover
- border border-gray-200
- bg-white

### Buttons
- Primary: bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 py-3 font-semibold
- Ghost: border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl px-6 py-3
- Disabled: opacity-50 cursor-not-allowed

### Mobile-First
- All layouts start single column
- Grid/flex adjustments at md: and lg: breakpoints
- Touch targets minimum 44px height

---

## VITE CONFIG

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

---

## ROOT PACKAGE.JSON

```json
{
  "name": "airco-proposal",
  "scripts": {
    "dev": "concurrently \"npm run client\" \"npm run server\"",
    "client": "cd client && npm run dev",
    "server": "node server/index.js",
    "build": "cd client && npm run build",
    "start": "NODE_ENV=production node server/index.js"
  },
  "dependencies": {
    "concurrently": "^8.2.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

---

## GIT SETUP

After the build is complete and running locally, run:

```bash
git init
git add .
git commit -m "initial build - airco proposal system v1"
```

Then push to a new private GitHub repo named: `airco-proposal`

---

## REPLIT SETUP

In Replit Secrets, set:
- `USE_MOCK` = `true`
- `DEMO_PASSWORD` = `airco2024`
- `PORT` = `3001`

Run command: `npm install && npm start`

---

## BEFORE YOU START — ASSET PLACEMENT

Two files must be placed in `client/public/` before running `npm run dev`. These are not created by Claude Code — they are provided externally:

| File | Destination | Used In |
|---|---|---|
| `airco-logo.png` | `client/public/airco-logo.png` | Nav, proposal page, checkout, confirmation |
| `airco-iaq-diagram.png` | `client/public/airco-iaq-diagram.png` | Add-ons page, Air Quality section |

If these files are not present, use a placeholder `<div>` with the text "AiRCO Mechanical" styled in blue/orange so the app still runs without broken image errors.

---

## BUILD ORDER

Build in this sequence to avoid broken imports:

1. Root `package.json` and `server/` files (backend first)
2. `client/src/data/` files (mock data)
3. `client/src/utils/` files (matching engine, formatters)
4. `client/src/components/` files (reusable components)
5. `client/src/pages/` files in this order:
   - TechnicianDashboard
   - EstimateBuilder
   - ProposalComparison
   - OptionDetail (as modal/panel, not separate page)
   - AddOns
   - Checkout
   - Confirmation
6. `client/src/App.jsx` routing
7. `client/index.html` and config files
8. Run `npm install` at root and `cd client && npm install`
9. Run `npm run dev` and verify all pages load

---

## GHL AUTOMATION TRIGGER MAP

Every user action in the homeowner flow must fire a trigger to `POST /api/ghl/trigger`. Wire these up in the frontend pages:

| User Action | Page | triggerName | When to Call |
|---|---|---|---|
| Technician clicks "Send to Homeowner" | EstimateBuilder | `estimate_sent` | After PATCH `/status` → `sent` succeeds |
| Homeowner opens proposal link | ProposalComparison | `estimate_viewed` | On page mount — fire once using `useEffect`, check `viewedAt` is null first |
| Homeowner clicks "Learn More" on any option | ProposalComparison | (no trigger) | No GHL trigger needed |
| Homeowner clicks "Select This System" | ProposalComparison | `option_selected` | After POST `/select` succeeds |
| Homeowner clicks "Apply Now" (financing) | Checkout | `financing_started` | On financing apply button click, before showing loading state |
| Mock financing approval completes | Checkout | `payment_completed` | After 2-second mock delay resolves |
| Mock Stripe payment completes | Checkout | `payment_completed` | After 1.5-second mock delay resolves |
| Homeowner clicks "Complete & Schedule Installation" | Checkout | `estimate_accepted` | After POST `/accept` succeeds, before navigating to Confirmation |

**Frontend helper for firing triggers (add to `utils/formatters.js` or a new `utils/api.js`):**

```javascript
export async function fireTrigger(estimateId, triggerName, payload = {}) {
  try {
    await fetch('/api/ghl/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estimateId, triggerName, ...payload })
    });
    // Fail silently — never block the UI waiting for a trigger response
  } catch (err) {
    console.warn(`GHL trigger failed: ${triggerName}`, err);
  }
}
```

**Status auto-update rule:** Every time a trigger fires that implies a status change, also call `PATCH /api/estimates/:id/status` with the matching status. The status lifecycle is:

```
draft → generated → sent → opened → explored → option_selected → financing_started → accepted
                                                                                    ↘ declined
```

---

## WHAT DONE LOOKS LIKE

The build is complete when:

- [ ] Technician Dashboard loads at `/tech` with 6+ mock estimates in the table
- [ ] New Estimate form generates 4 option cards after clicking "Generate Options"
- [ ] "Send to Homeowner" shows a success toast and updates estimate status
- [ ] Proposal Comparison page loads at `/proposal/:id` with all 4 option cards
- [ ] "Recommended" ribbon appears on the Best option
- [ ] "Learn More" opens detail panel with all 7 sections
- [ ] "Select This System" navigates to Add-Ons page
- [ ] Add-ons toggle on/off and running total updates in real time
- [ ] Checkout page shows both Financing and Pay Now paths
- [ ] Mock financing shows "Pre-Approved" after 2-second loading state
- [ ] Mock Stripe shows "Payment Successful" after 1.5-second loading state
- [ ] "Complete & Schedule Installation" button is disabled until terms + signature
- [ ] Confirmation page renders with green checkmark
- [ ] All pages are mobile-responsive
- [ ] No console errors on any page
- [ ] No ChiroDNA or Workflo branding anywhere — AiRCO Mechanical only
- [ ] AiRCO logo appears in nav, proposal page, checkout, and confirmation
- [ ] "Comfort in Simplicity" tagline appears on the proposal page
- [ ] Performance Guarantees banner appears below option cards
- [ ] IAQ diagram appears in add-ons Air Quality section
- [ ] License numbers appear in confirmation footer

- [ ] GHL trigger fires on "Send to Homeowner" (`estimate_sent`)
- [ ] GHL trigger fires on proposal page load (`estimate_viewed`) — once only
- [ ] GHL trigger fires on "Select This System" (`option_selected`)
- [ ] GHL trigger fires on "Apply Now" click (`financing_started`)
- [ ] GHL trigger fires on payment/financing completion (`payment_completed`)
- [ ] GHL trigger fires on "Complete & Schedule Installation" (`estimate_accepted`)
- [ ] Estimate status updates automatically at each trigger point
- [ ] `/api/health` returns `{ status: "ok", mode: "mock" }`

---

## FINAL NOTE

This is a Phase 1 demo. Build everything to feel real and premium. Every interaction should feel like a finished product, not a prototype. The homeowner experience in particular — ProposalComparison through Confirmation — should feel like a buying experience at a premium brand.

When in doubt, make it cleaner. Less clutter. More white space. Bigger price numbers. Confident, not busy.
