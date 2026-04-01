import { Router } from 'express';
import { db } from '../data/mockDb.js';

const router = Router();

router.post('/checkout', (req, res) => {
  const { estimateId, amount, paymentType } = req.body;

  if (!estimateId || !amount || !paymentType) {
    return res.status(400).json({ error: 'estimateId, amount, and paymentType are required' });
  }

  const estimate = db.getEstimateById(estimateId);
  if (!estimate) return res.status(404).json({ error: 'Estimate not found' });

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
