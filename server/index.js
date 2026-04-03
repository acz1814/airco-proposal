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

// Mock receipt email
app.post('/api/send-receipt', (req, res) => {
  const p = req.body;
  const email = p.homeownerEmail || 'unknown';
  const name = p.homeownerName || 'Homeowner';
  const system = p.systemName || 'HVAC System';

  const fmt = (v) => v != null ? `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';

  let paymentLine = 'Bill on Completion';
  if (p.paymentMethod === 'deposit') {
    paymentLine = `Deposit of ${fmt(p.depositAmount)} charged to card ending ${p.cardLast4 || 'XXXX'}`;
  }

  let investmentLines = `  System Cost:          ${fmt(p.systemCost)}`;
  if (p.iaqItems > 0) investmentLines += `\n  IAQ Items:            +${fmt(p.iaqItems)}`;
  if (p.totalDiscount > 0) investmentLines += `\n  Discounts Applied:    -${fmt(p.totalDiscount)}`;
  investmentLines += `\n  Total Investment:     ${fmt(p.totalInvestmentAfterDiscount)}`;
  investmentLines += `\n  Payment Method:       ${paymentLine}`;

  const body = `
========================================
MOCK RECEIPT EMAIL SENT
========================================
TO:      ${name} <${email}>
SUBJECT: Your AiRCO Mechanical Installation Agreement – ${system}
----------------------------------------

Thank you, ${name}! Your order is confirmed.

Address: ${p.address || 'N/A'}

SYSTEM SELECTED
  Name:     ${system}
  Tier:     ${p.tier || 'N/A'}
  SEER2:    ${p.seer2 || 'N/A'}
  Warranty: ${p.warranty || 'N/A'}

INVESTMENT SUMMARY
${investmentLines}

FINANCING OPTIONS
  0% APR for ${p.apr0Years || '?'} yrs: ${fmt(p.apr0Monthly)}/mo
  6.99% APR 10 yrs: ${fmt(p.apr699Monthly)}/mo

SIGNED CONTRACT ATTACHED
  Contract PDF attachment would be generated from DocuSeal in Phase 2

  Signed by: ${p.initials || 'N/A'} at ${p.signatureTimestamp || 'N/A'}

----------------------------------------
AiRCO Mechanical | 512-454-COOL | info@aircoaustin.com | TACLA51950C
========================================`;

  console.log(body);
  res.json({ success: true, message: `Receipt sent to ${email}` });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`AiRCO API running on port ${PORT} [${process.env.USE_MOCK === 'true' ? 'MOCK MODE' : 'LIVE MODE'}]`);
});
