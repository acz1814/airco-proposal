import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { matchOptions, calculateMonthlyPayment } from '../utils/matchingEngine';
import { formatCurrency } from '../utils/formatters';
import ProgressBar from '../components/ProgressBar';
import * as estimateStorage from '../utils/estimateStorage';

export default function PricingComparison() {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estimate, setEstimate] = useState(null);
  const [toast, setToast] = useState(null);
  // Restore Stage 2 state from estimate-scoped storage
  estimateStorage.setActiveEstimate(estimateId);
  const stage2Saved = estimateStorage.getJSON('stage2_state', {}) || {};

  const [selectedSystems, setSelectedSystems] = useState(stage2Saved.selectedSystems || []);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [discounts, setDiscounts] = useState(stage2Saved.discounts || {});
  const [incentives, setIncentives] = useState(stage2Saved.incentives || {});
  const [zeroAprYears, setZeroAprYears] = useState(stage2Saved.zeroAprYears || {});
  const [mfrRebates, setMfrRebates] = useState(stage2Saved.mfrRebates || {});
  const [utilityRebates, setUtilityRebates] = useState(stage2Saved.utilityRebates || {});

  const optionIds = searchParams.getAll('options');

  useEffect(() => {
    fetch(`/api/estimates/${estimateId}`)
      .then(r => r.json())
      .then(data => {
        if (data.estimate) {
          setEstimate(data.estimate);
          const matched = matchOptions(
            data.estimate.jobDetails.tonnage,
            data.estimate.jobDetails.systemType,
            data.estimate.jobDetails.fuelType
          );
          let filtered = matched.filter(o => optionIds.includes(o.id));
          const overrides = estimateStorage.getJSON('warranty_overrides', {}) || {};
          filtered = filtered.map(o => overrides[o.id]
            ? { ...o, warranty: { ...o.warranty, ...overrides[o.id] } }
            : o);
          setSelectedOptions(filtered);
          // Initialize default 0% APR years for any option not already restored
          setZeroAprYears(prev => {
            const next = { ...prev };
            filtered.forEach(o => { if (next[o.id] == null) next[o.id] = 10; });
            return next;
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [estimateId]);

  // Persist Stage 2 state on every change
  useEffect(() => {
    estimateStorage.setItem('stage2_state', {
      discounts, incentives, zeroAprYears, mfrRebates, utilityRebates, selectedSystems,
    });
  }, [discounts, incentives, zeroAprYears, mfrRebates, utilityRebates, selectedSystems]);

  const getVal = (obj, id) => parseFloat(obj[id]) || 0;

  const totalAfterDiscounts = (opt) =>
    opt.totalPrice - getVal(discounts, opt.id) - getVal(incentives, opt.id);

  const zeroAprMonthly = (opt) => {
    const total = totalAfterDiscounts(opt);
    const years = getVal(zeroAprYears, opt.id) || 10;
    return Math.ceil(total / years / 12);
  };

  const fixedAprMonthly = (opt) => {
    const total = totalAfterDiscounts(opt);
    return calculateMonthlyPayment(total, 6.99, 120);
  };

  const netInvestment = (opt) =>
    totalAfterDiscounts(opt) - getVal(mfrRebates, opt.id) - getVal(utilityRebates, opt.id);

  const toggleSystem = (optId) => {
    setSelectedSystems(prev =>
      prev.includes(optId) ? prev.filter(id => id !== optId) : [...prev, optId]
    );
  };

  const handleOpenSendModal = () => {
    if (!estimate) return;
    setSendEmail(estimate.homeowner?.email || '');
    setCcEmail('');
    setShowSendModal(true);
  };

  const handleSendNow = async () => {
    setSending(true);
    try {
      const systemNames = selectedOptions.map(o => o.systemName);
      await fetch('/api/ghl/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimateId,
          type: 'email',
          recipient: sendEmail,
          ccEmail: ccEmail || undefined,
          message: `Pricing comparison with systems: ${systemNames.join(', ')}`
        })
      });
      setShowSendModal(false);
      setToast({ type: 'success', message: `Comparison sent to ${sendEmail}` });
      setTimeout(() => setToast(null), 4000);
    } catch {
      setToast({ type: 'error', message: 'Failed to send comparison' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full" />
      </div>
    );
  }

  const inputClass = "w-28 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:ring-1 focus:ring-blue-500 outline-none";

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-medium
          ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <img src="/airco-logo.png" alt="AiRCO Mechanical" className="h-10 mx-auto"
            onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(`/proposal/${estimateId}`)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors mb-4"
          style={{ padding: '16px' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>

        <ProgressBar currentStep={1} />

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">Pricing Comparison</h1>

        {/* Cards Grid */}
        <div className={`grid gap-6 mb-10 ${selectedOptions.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' : selectedOptions.length === 2 ? 'grid-cols-1 md:grid-cols-2' : selectedOptions.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'}`}>
          {selectedOptions.map(opt => {
            const isSelected = selectedSystems.includes(opt.id);
            return (
              <div
                key={opt.id}
                className={`bg-white rounded-2xl shadow-md overflow-hidden transition-all cursor-pointer ${isSelected ? 'ring-2 ring-blue-600' : ''}`}
                onClick={() => toggleSystem(opt.id)}
              >
                {/* Orange Header */}
                <div className="px-5 py-4 text-center relative" style={{ backgroundColor: '#E8570C' }}>
                  <div
                    className={`absolute top-3 right-3 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-white/70 bg-white/20'
                    }`}
                    onClick={(e) => { e.stopPropagation(); toggleSystem(opt.id); }}
                  >
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <h2 className="text-white font-bold text-lg">{opt.systemName}</h2>
                  {opt.tier && <p className="text-orange-100 text-sm">{opt.tier}</p>}
                </div>

                {/* Pricing Rows */}
                <div className="divide-y divide-gray-100" onClick={e => e.stopPropagation()}>
                  {/* Warranty */}
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-gray-700">Warranty</span>
                    <span className="text-sm font-semibold text-gray-900">{opt.warranty.parts} Parts / {opt.warranty.labor} Labor</span>
                  </div>

                  {/* Total Price */}
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm font-semibold text-gray-700">Total Price</span>
                    <span className="font-bold text-gray-900">{formatCurrency(opt.totalPrice)}</span>
                  </div>

                  {/* Customer Discount */}
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
                    <span className="text-sm text-gray-700">Customer Discount $</span>
                    <input type="number" min="0" className={inputClass}
                      value={discounts[opt.id] || ''}
                      onChange={e => setDiscounts(p => ({ ...p, [opt.id]: e.target.value }))}
                      placeholder="0" />
                  </div>

                  {/* Mfr & Utility Incentives */}
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-gray-700">Mfr & Utility Incentives $</span>
                    <input type="number" min="0" className={inputClass}
                      value={incentives[opt.id] || ''}
                      onChange={e => setIncentives(p => ({ ...p, [opt.id]: e.target.value }))}
                      placeholder="0" />
                  </div>

                  {/* Total After Discounts — ACTUAL purchase price */}
                  <div className="px-5 py-3 bg-blue-600">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Total After Discounts</span>
                      <span className="font-bold text-white text-lg">{formatCurrency(totalAfterDiscounts(opt))}</span>
                    </div>
                    <p className="text-xs text-blue-100 italic mt-1">Your purchase price today</p>
                  </div>

                  {/* 0% APR */}
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-gray-700">
                      0% APR for{' '}
                      <input type="number" min="1" className="w-12 border border-gray-300 rounded px-1 py-0.5 text-sm text-center mx-1 focus:ring-1 focus:ring-blue-500 outline-none"
                        value={zeroAprYears[opt.id] || 10}
                        onChange={e => setZeroAprYears(p => ({ ...p, [opt.id]: e.target.value }))}
                      />
                      Yrs
                    </span>
                    <span className="text-sm text-gray-900">{formatCurrency(zeroAprMonthly(opt))}/mo</span>
                  </div>

                  {/* 6.99% APR */}
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
                    <span className="text-sm text-gray-700">6.99% APR for 10 Years</span>
                    <span className="text-sm text-gray-900">{formatCurrency(fixedAprMonthly(opt))}/mo</span>
                  </div>

                  {/* Manufacture Rebate */}
                  <div className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Manufacture Rebate $</span>
                      <input type="number" min="0" className={inputClass}
                        value={mfrRebates[opt.id] || ''}
                        onChange={e => setMfrRebates(p => ({ ...p, [opt.id]: e.target.value }))}
                        placeholder="0" />
                    </div>
                    <p className="text-xs italic text-gray-500 mt-1">Paid directly to customer after purchase</p>
                  </div>

                  {/* Utility Rebate */}
                  <div className="px-5 py-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Utility Rebate $</span>
                      <input type="number" min="0" className={inputClass}
                        value={utilityRebates[opt.id] || ''}
                        onChange={e => setUtilityRebates(p => ({ ...p, [opt.id]: e.target.value }))}
                        placeholder="0" />
                    </div>
                  </div>

                  {/* Net Investment (after rebates) */}
                  <div className="px-5 py-3 bg-orange-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Net Investment (after rebates)</span>
                      <span className="font-semibold text-gray-700">{formatCurrency(netInvestment(opt))}</span>
                    </div>
                    <p className="text-xs italic text-gray-500 mt-1">Rebates are not applied at time of purchase. Total After Discounts above is your purchase price today.</p>
                  </div>
                </div>

                {/* Selection indicator */}
                <div className="px-5 py-4">
                  <div
                    className={`w-full rounded-xl px-4 py-3 font-semibold text-center transition-colors ${
                      isSelected
                        ? 'bg-blue-700 text-white'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Tap to Select'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Action Buttons */}
        <div className="max-w-xl mx-auto space-y-3">
          {(selectedSystems.length === 1 || selectedOptions.length === 1) && (
            <button
              onClick={() => {
                const targetId = selectedSystems[0] || selectedOptions[0]?.id;
                const opt = selectedOptions.find(o => o.id === targetId);
                if (opt) {
                  estimateStorage.setItem('net_investment', {
                    netInvestment: netInvestment(opt),
                    totalAfterDiscounts: totalAfterDiscounts(opt),
                    systemName: opt.systemName,
                    tier: opt.tier,
                    efficiency: opt.efficiency,
                    warranty: opt.warranty,
                  });
                }
                navigate(`/proposal/${estimateId}/customize?option=${targetId}`);
              }}
              className="w-full rounded-xl px-8 py-3 font-semibold transition-colors text-lg bg-blue-700 hover:bg-blue-800 text-white cursor-pointer"
            >
              Select This System & Customize
            </button>
          )}
          <button
            onClick={handleOpenSendModal}
            className="w-full border-2 border-blue-700 text-blue-700 hover:bg-blue-50 rounded-xl px-8 py-3 font-semibold transition-colors text-lg"
          >
            Send All Options for Review
          </button>
        </div>
      </div>

      {/* Send Comparison Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSendModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Send Comparison for Review</h3>
              <button onClick={() => setShowSendModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Homeowner Email</label>
            <input
              type="email"
              value={sendEmail}
              onChange={e => setSendEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">CC (optional)</label>
            <input
              type="email"
              value={ccEmail}
              onChange={e => setCcEmail(e.target.value)}
              placeholder="Add CC email address"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Systems being sent:</p>
              <ul className="space-y-1">
                {selectedOptions.map(opt => (
                  <li key={opt.id} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                    {opt.systemName}{opt.tier ? ` (${opt.tier})` : ''}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleSendNow}
              disabled={sending || !sendEmail}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-4 py-3 font-semibold transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
