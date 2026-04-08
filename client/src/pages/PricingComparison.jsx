import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { matchOptions, calculateMonthlyPayment } from '../utils/matchingEngine';
import { formatCurrency } from '../utils/formatters';
import ProgressBar from '../components/ProgressBar';
import * as estimateStorage from '../utils/estimateStorage';
import EnergyCalculator from '../components/EnergyCalculator';

const iaqItems = [
  { key: 'preFilter', label: 'Pre Filter Ionizer', defaultPrice: 495 },
  { key: 'mediaFilter', label: 'Media Filter', defaultPrice: 395 },
  { key: 'germicidalLight', label: 'Germicidal Light (per bulb)', defaultPrice: 350 },
  { key: 'airPurifier', label: 'Air Purifier', defaultPrice: 895 },
];

function getDefaultIaqPrices() {
  const d = {};
  iaqItems.forEach(i => { d[i.key] = i.defaultPrice; });
  return d;
}

function parseWarrantyYears(str) {
  const m = str && str.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 1;
}

export default function PricingComparison() {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estimate, setEstimate] = useState(null);
  const [toast, setToast] = useState(null);

  estimateStorage.setActiveEstimate(estimateId);
  const stage2Saved = estimateStorage.getJSON('stage2_state', {}) || {};
  const unifiedSaved = estimateStorage.getJSON('unified_form', {}) || {};

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

  // IAQ state
  const [iaqIncluded, setIaqIncluded] = useState(unifiedSaved.iaqIncluded ?? true);
  const [iaqChecked, setIaqChecked] = useState(() => {
    if (unifiedSaved.iaqChecked) return unifiedSaved.iaqChecked;
    const d = {}; iaqItems.forEach(i => { d[i.key] = true; }); return d;
  });
  const [iaqPrices, setIaqPrices] = useState(unifiedSaved.iaqPrices || getDefaultIaqPrices());
  const [iaqDiscount, setIaqDiscount] = useState(unifiedSaved.iaqDiscount || 0);

  // Misc items rows (system & misc table)
  const [miscRows, setMiscRows] = useState(
    unifiedSaved.miscRows || [
      { included: false, desc: '', price: '' },
      { included: false, desc: '', price: '' },
      { included: false, desc: '', price: '' },
    ]
  );
  const [totalItemsManual, setTotalItemsManual] = useState(unifiedSaved.totalItemsManual || '');
  const [totalDiscountManual, setTotalDiscountManual] = useState(unifiedSaved.totalDiscountManual || '');

  const optionIds = searchParams.getAll('options');
  const singleOptionParam = searchParams.get('option');

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
          const ids = optionIds.length > 0
            ? optionIds
            : (singleOptionParam ? [singleOptionParam] : []);
          let filtered = matched.filter(o => ids.includes(o.id));
          const overrides = estimateStorage.getJSON('warranty_overrides', {}) || {};
          filtered = filtered.map(o => overrides[o.id]
            ? { ...o, warranty: { ...o.warranty, ...overrides[o.id] } }
            : o);
          setSelectedOptions(filtered);
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

  // Persist comparison state
  useEffect(() => {
    estimateStorage.setItem('stage2_state', {
      discounts, incentives, zeroAprYears, mfrRebates, utilityRebates, selectedSystems,
    });
  }, [discounts, incentives, zeroAprYears, mfrRebates, utilityRebates, selectedSystems]);

  // Persist unified-page state
  useEffect(() => {
    estimateStorage.setItem('unified_form', {
      iaqIncluded, iaqChecked, iaqPrices, iaqDiscount,
      miscRows, totalItemsManual, totalDiscountManual,
    });
  }, [iaqIncluded, iaqChecked, iaqPrices, iaqDiscount, miscRows, totalItemsManual, totalDiscountManual]);

  const getVal = (obj, id) => parseFloat(obj[id]) || 0;

  const totalAfterDiscounts = (opt) =>
    opt.totalPrice - getVal(discounts, opt.id) - getVal(incentives, opt.id);

  const zeroAprMonthly = (opt) => {
    const total = totalAfterDiscounts(opt);
    const years = getVal(zeroAprYears, opt.id) || 10;
    return Math.ceil(total / years / 12);
  };

  const fixedAprMonthly = (opt) =>
    calculateMonthlyPayment(totalAfterDiscounts(opt), 6.99, 120);

  const netInvestment = (opt) =>
    totalAfterDiscounts(opt) - getVal(mfrRebates, opt.id) - getVal(utilityRebates, opt.id);

  const toggleSystem = (optId) => {
    setSelectedSystems(prev =>
      prev.includes(optId) ? prev.filter(id => id !== optId) : [...prev, optId]
    );
  };

  // ----- Calculation box (uses the active selected option) -----
  const activeOpt =
    selectedOptions.find(o => o.id === selectedSystems[0]) || selectedOptions[0] || null;

  const iaqSubtotal = iaqIncluded
    ? iaqItems.reduce((s, i) => s + (iaqChecked[i.key] ? (parseFloat(iaqPrices[i.key]) || 0) : 0), 0)
    : 0;
  const iaqNet = Math.max(0, iaqSubtotal - (parseFloat(iaqDiscount) || 0));

  const miscSubtotal = miscRows.reduce(
    (s, r) => s + (r.included ? (parseFloat(r.price) || 0) : 0), 0
  );

  const sysTotalPrice = activeOpt?.totalPrice || 0;
  const sysMfrIncentive = activeOpt ? getVal(incentives, activeOpt.id) : 0;
  const sysCustomerDiscount = activeOpt ? getVal(discounts, activeOpt.id) : 0;
  const sysSubtotal = activeOpt ? totalAfterDiscounts(activeOpt) : 0;
  const sysMfrRebate = activeOpt ? getVal(mfrRebates, activeOpt.id) : 0;
  const sysUtilRebate = activeOpt ? getVal(utilityRebates, activeOpt.id) : 0;

  const totalItemsVal = parseFloat(totalItemsManual) || 0;
  const totalDiscountVal = parseFloat(totalDiscountManual) || 0;

  const totalNetInvestment =
    sysSubtotal + iaqNet + miscSubtotal + totalItemsVal
    - totalDiscountVal - sysMfrRebate - sysUtilRebate;

  const aprYears = activeOpt ? (getVal(zeroAprYears, activeOpt.id) || 10) : 10;
  const zeroAprMo = aprYears > 0 ? Math.ceil(Math.max(0, totalNetInvestment) / aprYears / 12) : 0;
  const fixedAprMo = calculateMonthlyPayment(Math.max(0, totalNetInvestment), 6.99, 120);

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
          estimateId, type: 'email', recipient: sendEmail,
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

  const handleContinue = () => {
    if (!activeOpt) return;
    const warrantyParts = parseWarrantyYears(activeOpt.warranty?.parts);
    const warrantyLabor = parseWarrantyYears(activeOpt.warranty?.labor);

    estimateStorage.setItem('net_investment', {
      netInvestment: netInvestment(activeOpt),
      totalAfterDiscounts: sysSubtotal,
      systemName: activeOpt.systemName,
      tier: activeOpt.tier,
      efficiency: activeOpt.efficiency,
      warranty: activeOpt.warranty,
    });

    estimateStorage.setItem('customize_data', {
      iaqIncluded,
      iaqChecked,
      iaqPrices,
      iaqDiscount,
      iaqSubtotal,
      iaqAfterDiscount: iaqNet,
      miscIncluded: miscRows.some(r => r.included),
      miscRows,
      miscAfterDiscount: miscSubtotal,
      totalItemsManual: totalItemsVal,
      totalDiscountManual: totalDiscountVal,
      combinedTotal: sysSubtotal + iaqNet + miscSubtotal + totalItemsVal,
      combinedAfterDiscount: totalNetInvestment,
    });

    estimateStorage.setItem('customize_summary', {
      systemName: activeOpt.systemName,
      tier: activeOpt.tier,
      seer2: activeOpt.efficiency,
      warranty: activeOpt.warranty,
      systemCost: sysSubtotal,
      iaqItems: iaqNet,
      totalDiscount: totalDiscountVal + sysCustomerDiscount,
      totalInvestmentAfterDiscount: totalNetInvestment,
      apr0Monthly: zeroAprMo,
      apr699Monthly: fixedAprMo,
      apr0Years: aprYears,
      miscDescription: miscRows.filter(r => r.included && r.desc).map(r => r.desc).join(', '),
    });

    navigate(`/proposal/${estimateId}/terms?option=${activeOpt.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full" />
      </div>
    );
  }

  const inputClass = "w-28 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:ring-1 focus:ring-blue-500 outline-none";
  const navyHeader = "text-white font-bold text-sm uppercase tracking-wide px-5 py-3";

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
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

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">Select &amp; Customize Your System</h1>

        {/* A. SYSTEM COMPARISON CARDS */}
        <div className={`grid gap-6 mb-10 ${selectedOptions.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' : selectedOptions.length === 2 ? 'grid-cols-1 md:grid-cols-2' : selectedOptions.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'}`}>
          {selectedOptions.map(opt => {
            const isSelected = selectedSystems.includes(opt.id);
            return (
              <div
                key={opt.id}
                className={`bg-white rounded-2xl shadow-md overflow-hidden transition-all cursor-pointer ${isSelected ? 'ring-2 ring-blue-600' : ''}`}
                onClick={() => toggleSystem(opt.id)}
              >
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

                <div className="divide-y divide-gray-100" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-gray-700">Warranty</span>
                    <span className="text-sm font-semibold text-gray-900">{opt.warranty.parts} Parts / {opt.warranty.labor} Labor</span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm font-semibold text-gray-700">Total Price</span>
                    <span className="font-bold text-gray-900">{formatCurrency(opt.totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
                    <span className="text-sm text-gray-700">Customer Discount $</span>
                    <input type="number" min="0" className={inputClass}
                      value={discounts[opt.id] || ''}
                      onChange={e => setDiscounts(p => ({ ...p, [opt.id]: e.target.value }))}
                      placeholder="0" />
                  </div>
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-gray-700">Mfr &amp; Utility Incentives $</span>
                    <input type="number" min="0" className={inputClass}
                      value={incentives[opt.id] || ''}
                      onChange={e => setIncentives(p => ({ ...p, [opt.id]: e.target.value }))}
                      placeholder="0" />
                  </div>
                  <div className="px-5 py-3 bg-blue-600">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Total After Discounts</span>
                      <span className="font-bold text-white text-lg">{formatCurrency(totalAfterDiscounts(opt))}</span>
                    </div>
                    <p className="text-xs text-blue-100 italic mt-1">Your purchase price today</p>
                  </div>
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
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
                    <span className="text-sm text-gray-700">6.99% APR for 10 Years</span>
                    <span className="text-sm text-gray-900">{formatCurrency(fixedAprMonthly(opt))}/mo</span>
                  </div>
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
                  <div className="px-5 py-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Utility Rebate $</span>
                      <input type="number" min="0" className={inputClass}
                        value={utilityRebates[opt.id] || ''}
                        onChange={e => setUtilityRebates(p => ({ ...p, [opt.id]: e.target.value }))}
                        placeholder="0" />
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-orange-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Net Investment (after rebates)</span>
                      <span className="font-semibold text-gray-700">{formatCurrency(netInvestment(opt))}</span>
                    </div>
                    <p className="text-xs italic text-gray-500 mt-1">Rebates are not applied at time of purchase. Total After Discounts above is your purchase price today.</p>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div
                    className={`w-full rounded-xl px-4 py-3 font-semibold text-center transition-colors ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Tap to Select'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Send for review */}
        <div className="max-w-xl mx-auto mb-10">
          <button
            onClick={handleOpenSendModal}
            className="w-full border-2 border-blue-700 text-blue-700 hover:bg-blue-50 rounded-xl px-8 py-3 font-semibold transition-colors"
          >
            Send All Options for Review
          </button>
        </div>

        {/* C. IAQ SECTION */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
          <div className={navyHeader} style={{ backgroundColor: '#1e3a5f' }}>
            OPTIONAL INDOOR AIR QUALITY (IAQ)
          </div>
          <div className="p-5">
            <label className="flex items-center gap-3 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={iaqIncluded}
                onChange={e => setIaqIncluded(e.target.checked)}
                className="w-5 h-5 text-blue-700 rounded focus:ring-blue-500"
              />
              <span className="font-semibold text-gray-900">Include Indoor Air Quality System</span>
            </label>

            <div className="space-y-6">
              <div className="flex justify-center">
                <img src="/iaq-diagram.png" alt="IAQ System Diagram" style={{ width: '100%', maxWidth: '700px', display: 'block', margin: '16px auto' }} />
              </div>

              <div className="flex flex-row justify-between gap-4 mb-6">
                {iaqItems.map(item => (
                  <div key={item.key} className="flex flex-col items-center flex-1">
                    <label className="flex items-center gap-2 cursor-pointer mb-1">
                      <input
                        type="checkbox"
                        checked={!!iaqChecked[item.key]}
                        onChange={e => setIaqChecked(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        className="w-4 h-4 text-blue-700 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 text-center">{item.label}</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500">$</span>
                      <input
                        type="number"
                        min="0"
                        value={iaqPrices[item.key] || ''}
                        onChange={e => setIaqPrices(prev => ({ ...prev, [item.key]: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Complete Indoor Air Quality System</span>
                  <span className="font-semibold">{formatCurrency(iaqSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Total IAQ System Discount</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      value={iaqDiscount || ''}
                      onChange={e => setIaqDiscount(e.target.value)}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* D. SYSTEM & MISCELLANEOUS ITEMS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
          <div className={navyHeader} style={{ backgroundColor: '#1e3a5f' }}>
            SYSTEM AND MISCELLANEOUS ITEMS
          </div>
          <div className="p-5">
            <div className="space-y-2">
              <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">
                <div className="col-span-2">Included</div>
                <div className="col-span-7">Item Description</div>
                <div className="col-span-3 text-right">Price</div>
              </div>
              {miscRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!row.included}
                      onChange={e => setMiscRows(rows => rows.map((r, i) => i === idx ? { ...r, included: e.target.checked } : r))}
                      className="w-4 h-4 text-blue-700 rounded focus:ring-blue-500"
                    />
                    Included
                  </label>
                  <input
                    type="text"
                    value={row.desc}
                    onChange={e => setMiscRows(rows => rows.map((r, i) => i === idx ? { ...r, desc: e.target.value } : r))}
                    placeholder="Item description..."
                    className="col-span-7 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <div className="col-span-3 flex items-center gap-1 justify-end">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      value={row.price}
                      onChange={e => setMiscRows(rows => rows.map((r, i) => i === idx ? { ...r, price: e.target.value } : r))}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMiscRows(rows => [...rows, { included: false, desc: '', price: '' }])}
              className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              + Add Item
            </button>
          </div>
        </div>

        {/* E. PRICING INPUTS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
          <div className={navyHeader} style={{ backgroundColor: '#1e3a5f' }}>
            PRICING INPUTS
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Total Items $</span>
              <input
                type="number"
                min="0"
                value={totalItemsManual}
                onChange={e => setTotalItemsManual(e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Total Discount $</span>
              <input
                type="number"
                min="0"
                value={totalDiscountManual}
                onChange={e => setTotalDiscountManual(e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* F. FINANCIAL CALCULATION BOX */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
          <div className={navyHeader} style={{ backgroundColor: '#1e3a5f' }}>
            FINANCIAL CALCULATION
          </div>
          <div className="p-5">
            {!activeOpt && (
              <p className="text-sm text-gray-500 italic mb-4">Select a system above to see calculations.</p>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">System Total Price</span>
                <span className="font-medium">{formatCurrency(sysTotalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">- Manufacturer Rebates</span>
                <span className="font-medium text-green-700">-{formatCurrency(sysMfrIncentive)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">- Customer Discounts</span>
                <span className="font-medium text-green-700">-{formatCurrency(sysCustomerDiscount)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                <span className="text-gray-900">System Subtotal</span>
                <span className="text-gray-900">{formatCurrency(sysSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">IAQ Subtotal</span>
                <span className="font-medium">{formatCurrency(iaqNet)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Miscellaneous Subtotal</span>
                <span className="font-medium">{formatCurrency(miscSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Total Items</span>
                <span className="font-medium">{formatCurrency(totalItemsVal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Total Discount</span>
                <span className="font-medium text-green-700">-{formatCurrency(totalDiscountVal)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Post-purchase Rebates (after install)</p>
                <div className="flex justify-between">
                  <span className="text-gray-700">Manufacturer Rebate</span>
                  <span className="font-medium text-green-700">-{formatCurrency(sysMfrRebate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Utility Rebate</span>
                  <span className="font-medium text-green-700">-{formatCurrency(sysUtilRebate)}</span>
                </div>
              </div>
              <div className="border-t-2 border-gray-300 pt-3 flex justify-between text-base font-bold">
                <span className="text-gray-900">Total Net Investment</span>
                <span className="text-gray-900">{formatCurrency(totalNetInvestment)}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-600 uppercase tracking-wide">0% APR for {aprYears} Yrs</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{formatCurrency(zeroAprMo)}<span className="text-base font-semibold">/mo</span></p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-600 uppercase tracking-wide">6.99% APR for 10 Yrs</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{formatCurrency(fixedAprMo)}<span className="text-base font-semibold">/mo</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* G. ENERGY SAVINGS CALCULATOR */}
        <EnergyCalculator
          selectedSystemSeer={activeOpt?.efficiency || 0}
          onSavingsCalculated={() => {}}
        />

        {/* H. CONTINUE */}
        <button
          onClick={handleContinue}
          disabled={!activeOpt}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white rounded-xl px-6 py-4 font-semibold text-lg transition-colors mb-8"
        >
          Continue to Sign &rarr;
        </button>
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
