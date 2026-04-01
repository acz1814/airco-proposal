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

export default router;
