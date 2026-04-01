import { Router } from 'express';
import { db } from '../data/mockDb.js';

const router = Router();

// GET /api/estimates — list all estimates
router.get('/', (req, res) => {
  const estimates = db.getAllEstimates();
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
