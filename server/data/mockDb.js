import { mockEstimates } from '../../client/src/data/mockEstimates.js';

// In-memory store — seeded from mock data on startup
let estimates = [...mockEstimates];

export const db = {
  getAllEstimates() {
    return [...estimates];
  },

  getEstimateById(id) {
    return estimates.find(e => e.id === id) || null;
  },

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

  updateEstimate(id, updates) {
    const idx = estimates.findIndex(e => e.id === id);
    if (idx === -1) return null;
    estimates[idx] = { ...estimates[idx], ...updates };
    return estimates[idx];
  },

  logActivity(estimateId, event, data = {}) {
    console.log(`[Activity] ${estimateId} | ${event}`, data);
  }
};
