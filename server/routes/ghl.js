import { Router } from 'express';
import { db } from '../data/mockDb.js';

const router = Router();

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

router.post('/trigger', (req, res) => {
  const { estimateId, triggerName, payload = {} } = req.body;

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

  res.json({
    triggered: true,
    triggerName,
    estimateId,
    timestamp: new Date().toISOString()
  });
});

router.post('/notify', (req, res) => {
  const { estimateId, type, recipient, message } = req.body;

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

// PHASE 2 PRODUCTION WIRING:
// 1. Generate PDF from contract data using PDFKit or Puppeteer
// 2. Upload PDF to GHL contact record via GHL Documents API
// 3. POST to Axis Op FastAPI gateway (Node 1:8765) for agentic processing
// 4. Store in DocuSeal on Node 3 for official signed document archive
// 5. Send webhook to Ntfy (Node 4:2586) to alert Aldo and Bethany of new signed contract
router.post('/contract', (req, res) => {
  const { estimateId, signatureText, signatureTimestamp, homeownerName, homeownerEmail, selectedSystem } = req.body;

  console.log('[GHL Contract] New signed contract received:');
  console.log('  estimateId:', estimateId);
  console.log('  signatureText:', signatureText);
  console.log('  signatureTimestamp:', signatureTimestamp);
  console.log('  homeownerName:', homeownerName);
  console.log('  homeownerEmail:', homeownerEmail);
  console.log('  selectedSystem:', selectedSystem);

  res.json({
    success: true,
    contractId: 'mock_contract_' + estimateId,
    message: 'Contract recorded. In production this will: 1) Generate a PDF contract, 2) Upload to GHL contact record, 3) Send to Axis Op agentic system via webhook, 4) Trigger DocuSeal for official document storage on Node 3',
    timestamp: new Date().toISOString()
  });
});

// PHASE 2 PRODUCTION WIRING:
// Replace the mock console.log with a real email send (GHL Conversations API or
// standalone SMTP via nodemailer). The payload shape below is the contract —
// keep field names stable so the client does not need to change.
router.post('/receipt', (req, res) => {
  const {
    estimateId,
    homeownerEmail,
    ccEmail,
    homeownerName,
    systemName,
    tier,
    totalAfterDiscounts,
    iaqItems,
    grandTotal,
    paymentMethod,
    netInvestment,
    mfrRebate,
    utilityRebate,
    signedAgreement,
    photoDataUrls,
    timestamp,
  } = req.body || {};

  console.log('[GHL Receipt] Email customer receipt:');
  console.log('  estimateId:', estimateId);
  console.log('  to:', homeownerEmail, '| cc:', ccEmail || '(none)');
  console.log('  system:', systemName, tier);
  console.log('  totalAfterDiscounts:', totalAfterDiscounts, '| grandTotal:', grandTotal);
  console.log('  paymentMethod:', paymentMethod, '| netInvestment:', netInvestment);
  console.log('  rebates: mfr=', mfrRebate, '| utility=', utilityRebate);
  console.log('  signedAgreement:', signedAgreement);
  console.log('  iaqItems:', Array.isArray(iaqItems) ? iaqItems.length : 0);
  console.log('  photos:', Array.isArray(photoDataUrls) ? photoDataUrls.length : 0);

  if (estimateId) {
    db.logActivity(estimateId, 'receipt_emailed', {
      homeownerEmail, ccEmail: ccEmail || null, systemName, grandTotal,
    });
  }

  res.json({
    sent: true,
    receiptId: `mock_receipt_${Date.now().toString(36)}`,
    homeownerEmail,
    ccEmail: ccEmail || null,
    timestamp: timestamp || new Date().toISOString(),
  });
});

export default router;
