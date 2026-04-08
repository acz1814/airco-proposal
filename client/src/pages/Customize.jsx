import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import { calculateMonthlyPayment } from '../utils/matchingEngine';
import { formatCurrency } from '../utils/formatters';
import * as estimateStorage from '../utils/estimateStorage';

const iaqItems = [
  { key: 'preFilter', label: 'Pre Filter Ionizer', defaultPrice: 495 },
  { key: 'mediaFilter', label: 'Media Filter', defaultPrice: 395 },
  { key: 'germicidalLight', label: 'Germicidal Light (per bulb)', defaultPrice: 350 },
  { key: 'airPurifier', label: 'Air Purifier', defaultPrice: 895 },
];

function parseWarrantyYears(str) {
  const m = str && str.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 1;
}

function getDefaultIaqPrices() {
  const defaults = {};
  iaqItems.forEach(item => { defaults[item.key] = item.defaultPrice; });
  return defaults;
}

export default function Customize() {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [estimate, setEstimate] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [loading, setLoading] = useState(true);
  const restoredRef = useRef(false);

  // IAQ state
  const [iaqIncluded, setIaqIncluded] = useState(true);
  const [iaqChecked, setIaqChecked] = useState(() => {
    const d = {};
    iaqItems.forEach(i => { d[i.key] = true; });
    return d;
  });
  const [iaqPrices, setIaqPrices] = useState(getDefaultIaqPrices);
  const [iaqDiscount, setIaqDiscount] = useState(0);

  // Misc state
  const [miscDescription, setMiscDescription] = useState('');
  const [miscDiscount, setMiscDiscount] = useState(0);
  const [miscAprYears, setMiscAprYears] = useState(10);

  const optionId = searchParams.get('option');

  useEffect(() => { estimateStorage.setActiveEstimate(estimateId); }, [estimateId]);

  // Restore form state from estimate-scoped storage on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const s = estimateStorage.getJSON('customize_form');
    if (!s) return;
    if (s.iaqIncluded !== undefined) setIaqIncluded(s.iaqIncluded);
    if (s.iaqChecked && typeof s.iaqChecked === 'object') {
      const savedVals = Object.values(s.iaqChecked);
      const allFalse = savedVals.length > 0 && savedVals.every(v => v === false);
      if (!allFalse) {
        setIaqChecked(prev => {
          const next = { ...prev };
          Object.entries(s.iaqChecked).forEach(([k, v]) => {
            if (v === false) next[k] = false;
          });
          return next;
        });
      }
    }
    if (s.iaqPrices) setIaqPrices(s.iaqPrices);
    if (s.iaqDiscount !== undefined) setIaqDiscount(s.iaqDiscount);
    if (s.miscDescription !== undefined) setMiscDescription(s.miscDescription);
    if (s.miscDiscount !== undefined) setMiscDiscount(s.miscDiscount);
    if (s.miscAprYears !== undefined) setMiscAprYears(s.miscAprYears);
  }, []);

  // Persist form state on every change
  useEffect(() => {
    estimateStorage.setItem('customize_form', {
      iaqIncluded, iaqChecked, iaqPrices, iaqDiscount,
      miscDescription, miscDiscount, miscAprYears,
    });
  }, [iaqIncluded, iaqChecked, iaqPrices, iaqDiscount, miscDescription, miscDiscount, miscAprYears]);

  // Load estimate + read system info from estimate-scoped storage
  useEffect(() => {
    fetch(`/api/estimates/${estimateId}`)
      .then(r => r.json())
      .then(data => {
        if (data.estimate) setEstimate(data.estimate);
        const stored = estimateStorage.getJSON('net_investment');
        if (stored) setSelectedSystem(stored);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [estimateId]);

  // IAQ calculations
  const iaqSubtotal = iaqIncluded
    ? iaqItems.reduce((sum, item) => sum + (iaqChecked[item.key] ? (parseFloat(iaqPrices[item.key]) || 0) : 0), 0)
    : 0;
  const iaqNet = Math.max(0, iaqSubtotal - (parseFloat(iaqDiscount) || 0));

  const systemPrice = selectedSystem?.totalAfterDiscounts ?? selectedSystem?.netInvestment ?? 0;

  // Combined section calculations
  const combinedTotal = iaqNet + systemPrice;
  const combinedAfterDiscount = Math.max(0, combinedTotal - (parseFloat(miscDiscount) || 0));
  const combinedZeroAprMonthly = miscAprYears > 0 ? Math.ceil(combinedAfterDiscount / miscAprYears / 12) : 0;
  const combinedFixedAprMonthly = calculateMonthlyPayment(combinedAfterDiscount, 6.99, 120);
  const warrantyParts = selectedSystem ? parseWarrantyYears(selectedSystem.warranty?.parts) : 5;
  const warrantyLabor = selectedSystem ? parseWarrantyYears(selectedSystem.warranty?.labor) : 1;

  const handleContinue = () => {
    const customizeData = {
      iaqIncluded,
      iaqChecked,
      iaqPrices,
      iaqDiscount,
      iaqSubtotal,
      miscDescription,
      combinedTotal,
      miscDiscount: parseFloat(miscDiscount) || 0,
      combinedAfterDiscount,
    };
    estimateStorage.setItem('customize_data', customizeData);
    estimateStorage.setItem('customize_summary', {
      systemName: selectedSystem?.systemName || '',
      tier: selectedSystem?.tier || '',
      seer2: selectedSystem?.efficiency || '',
      warranty: selectedSystem?.warranty || null,
      systemCost: systemPrice,
      iaqItems: iaqNet,
      totalDiscount: parseFloat(miscDiscount) || 0,
      totalInvestmentAfterDiscount: combinedAfterDiscount,
      apr0Monthly: combinedZeroAprMonthly,
      apr699Monthly: combinedFixedAprMonthly,
      apr0Years: miscAprYears,
      miscDescription,
    });
    navigate(`/proposal/${estimateId}/terms?option=${optionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full" />
      </div>
    );
  }

  const inputClass = "w-28 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:ring-1 focus:ring-blue-500 outline-none";
  const navyHeader = "text-white font-bold text-sm uppercase tracking-wide px-5 py-3 rounded-t-xl";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <img src="/airco-logo.png" alt="AiRCO Mechanical" className="h-10 mx-auto"
            onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors mb-4"
          style={{ padding: '16px' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>

        <ProgressBar currentStep={2} />

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight text-center mb-8">
          Customize Your System
        </h1>

        {/* Selected System Summary */}
        {selectedSystem && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-3">Selected System</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-gray-500">System</p>
                <p className="font-semibold text-gray-900">{selectedSystem.systemName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tier</p>
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                  { Good: 'bg-gray-100 text-gray-700', Better: 'bg-blue-100 text-blue-700', Best: 'bg-blue-600 text-white', Premium: 'bg-indigo-600 text-white' }[selectedSystem.tier] || 'bg-gray-100 text-gray-700'
                }`}>{selectedSystem.tier}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">SEER2</p>
                <p className="font-semibold text-gray-900">{selectedSystem.efficiency}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total After Discounts</p>
                <p className="font-semibold text-gray-900">{formatCurrency(selectedSystem?.totalAfterDiscounts ?? systemPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Warranty</p>
                <p className="font-semibold text-gray-900">Parts {warrantyParts} yr, Labor {warrantyLabor} yr</p>
              </div>
            </div>
          </div>
        )}

        {/* IAQ Section */}
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

            {(
              <div className="space-y-6">
                {/* IAQ Diagram */}
                <div className="flex justify-center">
                  <img src="/iaq-diagram.png" alt="IAQ System Diagram" style={{ width: '100%', maxWidth: '700px', display: 'block', margin: '16px auto' }} />
                </div>

                {/* IAQ Component checkboxes - horizontal row */}
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

                {/* Totals */}
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
            )}
          </div>
        </div>

        {/* System and Miscellaneous Items Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
          <div className={navyHeader} style={{ backgroundColor: '#1e3a5f' }}>
            SYSTEM AND MISCELLANEOUS ITEMS
          </div>
          <div className="p-5">
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Description</label>
              <textarea
                value={miscDescription}
                onChange={e => setMiscDescription(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Describe miscellaneous items..."
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">IAQ Items</span>
                <span className="font-semibold">{formatCurrency(iaqNet)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">System Cost</span>
                <span className="font-semibold">{formatCurrency(systemPrice)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
                <span className="text-gray-900">Total Items</span>
                <span className="text-gray-900">{formatCurrency(combinedTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">Total Discount</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    value={miscDiscount || ''}
                    onChange={e => setMiscDiscount(e.target.value)}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
                <span className="text-gray-900">Total Investment After Discount</span>
                <span className="text-gray-900">{formatCurrency(combinedAfterDiscount)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">Purchase Options</p>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-700">
                    0% APR for{' '}
                    <input
                      type="number"
                      min="1"
                      value={miscAprYears}
                      onChange={e => setMiscAprYears(parseInt(e.target.value) || 0)}
                      className="w-12 border border-gray-300 rounded px-1 py-0.5 text-sm text-center mx-1 focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="10"
                    />
                    Years*
                  </span>
                  <span className="font-semibold">{formatCurrency(combinedZeroAprMonthly)}/mo</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">6.99% APR for 10 Years*</span>
                  <span className="font-semibold">{formatCurrency(combinedFixedAprMonthly)}/mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-500 text-center italic mb-8">
          *With approved credit. Monthly payment may vary slightly.
          We do not accept cash. Check or Money Orders must be used for cash discount.
        </p>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 py-4 font-semibold text-lg transition-colors mb-8"
        >
          Continue to Checkout &rarr;
        </button>
      </div>
    </div>
  );
}
