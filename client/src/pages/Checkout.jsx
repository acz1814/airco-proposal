import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import { addons as allAddons } from '../data/addons';
import { financingPlans } from '../data/financing';
import { matchOptions, calculateMonthlyPayment } from '../utils/matchingEngine';
import { formatCurrency, fireTrigger } from '../utils/formatters';

export default function Checkout() {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedOption, setSelectedOption] = useState(location.state?.selectedOption || null);
  const [selectedAddonIds, setSelectedAddonIds] = useState(location.state?.selectedAddons || []);
  const [estimate, setEstimate] = useState(null);

  const [financingPlanId, setFinancingPlanId] = useState('plan-18mo');
  const [financingState, setFinancingState] = useState('idle'); // idle | loading | approved
  const [paymentState, setPaymentState] = useState('idle'); // idle | loading | success | error
  const [paymentType, setPaymentType] = useState('full');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signature, setSignature] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null); // 'financing' | 'stripe'

  useEffect(() => {
    if (!selectedOption) {
      fetch(`/api/estimates/${estimateId}`)
        .then(r => r.json())
        .then(data => {
          if (data.estimate) {
            setEstimate(data.estimate);
            const options = matchOptions(
              data.estimate.jobDetails.tonnage,
              data.estimate.jobDetails.systemType,
              data.estimate.jobDetails.fuelType
            );
            const opt = options.find(o => o.id === data.estimate.selectedOptionId);
            if (opt) setSelectedOption(opt);
            if (data.estimate.selectedAddons?.length) setSelectedAddonIds(data.estimate.selectedAddons);
          }
        });
    }
  }, [estimateId, selectedOption]);

  const selectedAddonItems = allAddons.filter(a => selectedAddonIds.includes(a.id));
  const addonTotal = selectedAddonItems.reduce((sum, a) => sum + a.price, 0);
  const basePrice = selectedOption?.totalPrice || 0;
  const rebate = selectedOption?.rebates || 0;
  const finalTotal = basePrice + addonTotal - rebate;
  const depositAmount = Math.round(finalTotal * 0.1);

  const selectedPlan = financingPlans.find(p => p.id === financingPlanId);
  const monthlyPayment = selectedPlan
    ? calculateMonthlyPayment(finalTotal, selectedPlan.apr, selectedPlan.months)
    : 0;

  const handleFinancingApply = async () => {
    setPaymentMethod('financing');
    setFinancingState('loading');
    await fireTrigger(estimateId, 'financing_started');
    await fetch(`/api/estimates/${estimateId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'financing_started' })
    });

    setTimeout(async () => {
      setFinancingState('approved');
      await fireTrigger(estimateId, 'payment_completed', { method: 'financing' });
    }, 2000);
  };

  const handleStripePayment = async (type) => {
    setPaymentMethod('stripe');
    setPaymentType(type);
    setPaymentState('loading');

    const amount = type === 'full' ? finalTotal : depositAmount;

    setTimeout(async () => {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId, amount, paymentType: type })
      });
      const data = await res.json();
      if (data.success) {
        setPaymentState('success');
        await fireTrigger(estimateId, 'payment_completed', { method: 'stripe', paymentType: type });
      } else {
        setPaymentState('error');
      }
    }, 1500);
  };

  const canComplete = termsAccepted && signature.trim().length > 2 &&
    (financingState === 'approved' || paymentState === 'success');

  const handleComplete = async () => {
    const paymentStatus = financingState === 'approved' ? 'financing_approved'
      : paymentType === 'full' ? 'paid_in_full' : 'deposit_paid';

    await fetch(`/api/estimates/${estimateId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedOptionId: selectedOption.id,
        selectedAddons: selectedAddonIds,
        subtotal: basePrice,
        addonTotal,
        rebate,
        finalTotal,
        paymentMethod: paymentMethod,
        paymentStatus,
        paymentId: `mock_pi_${Date.now().toString(36)}`,
        financingPlanId: paymentMethod === 'financing' ? financingPlanId : null,
        monthlyPayment: paymentMethod === 'financing' ? monthlyPayment : null,
        signature
      })
    });

    await fireTrigger(estimateId, 'estimate_accepted');
    navigate(`/proposal/${estimateId}/confirm`, {
      state: { selectedOption, finalTotal, paymentMethod, monthlyPayment, signature }
    });
  };

  if (!selectedOption) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <img src="/airco-logo.png" alt="AiRCO Mechanical" className="h-10 mx-auto"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden items-center justify-center gap-1 text-xl font-bold" style={{ display: 'none' }}>
            <span className="text-blue-700">AiRCO</span>
            <span className="text-orange-500">Mechanical</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <ProgressBar currentStep={3} />

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight text-center mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{selectedOption.systemName}</p>
                  <p className="text-sm text-gray-500">{selectedOption.tier} · {selectedOption.efficiency}</p>
                </div>
                <span className="font-semibold">{formatCurrency(basePrice)}</span>
              </div>
              {selectedAddonItems.map(addon => (
                <div key={addon.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{addon.name}</span>
                  <span className="font-medium">+{formatCurrency(addon.price)}</span>
                </div>
              ))}
              {addonTotal > 0 && (
                <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(basePrice + addonTotal)}</span>
                </div>
              )}
              {rebate > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Rebate</span>
                  <span className="font-medium">-{formatCurrency(rebate)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-xl font-bold text-gray-900">Final Total</span>
                <span className="text-3xl font-bold text-gray-900">{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </div>

          {/* Right: Payment Options */}
          <div className="space-y-6">
            {/* Financing Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <img src="/airco-logo.png" alt="AiRCO" className="h-8"
                  onError={(e) => { e.target.style.display = 'none'; }} />
                <h3 className="text-lg font-bold text-gray-900">Flexible Monthly Payments</h3>
              </div>

              {financingState === 'approved' ? (
                <div className="bg-green-50 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-green-700">Pre-Approved!</p>
                  <p className="text-green-600">Monthly payment: {formatCurrency(monthlyPayment)}/mo</p>
                </div>
              ) : (
                <>
                  <select value={financingPlanId} onChange={e => setFinancingPlanId(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 mb-3 focus:ring-2 focus:ring-blue-500 outline-none">
                    {financingPlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}{plan.tag ? ` (${plan.tag})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mb-1">{selectedPlan?.description}</p>
                  <p className="text-lg font-semibold text-blue-700 mb-4">
                    {formatCurrency(monthlyPayment)}/mo for {selectedPlan?.months} months
                  </p>
                  <button onClick={handleFinancingApply} disabled={financingState === 'loading'}
                    className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl px-6 py-3 font-semibold transition-colors">
                    {financingState === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Checking approval...
                      </span>
                    ) : 'Apply Now'}
                  </button>
                </>
              )}
            </div>

            {/* Stripe Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Pay in Full or Leave a Deposit</h3>

              {paymentState === 'success' ? (
                <div className="bg-green-50 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-green-700">Payment Successful</p>
                  <p className="text-green-600">{paymentType === 'full' ? 'Paid in full' : 'Deposit received'}</p>
                </div>
              ) : paymentState === 'error' ? (
                <div className="bg-red-50 rounded-xl p-4 text-center mb-4">
                  <p className="text-red-600 font-medium">Your card was declined. Please try again.</p>
                </div>
              ) : null}

              {paymentState !== 'success' && (
                <div className="space-y-3">
                  <button onClick={() => handleStripePayment('full')}
                    disabled={paymentState === 'loading'}
                    className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl px-6 py-3 font-semibold transition-colors">
                    {paymentState === 'loading' && paymentType === 'full' ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Processing...
                      </span>
                    ) : `Pay ${formatCurrency(finalTotal)}`}
                  </button>
                  <button onClick={() => handleStripePayment('deposit')}
                    disabled={paymentState === 'loading'}
                    className="w-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 rounded-xl px-6 py-3 font-semibold transition-colors">
                    {paymentState === 'loading' && paymentType === 'deposit' ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                        Processing...
                      </span>
                    ) : `Pay ${formatCurrency(depositAmount)} Deposit`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Below both cards */}
        <div className="mt-8 max-w-3xl mx-auto space-y-6">
          <p className="text-xs text-gray-500 text-center italic">
            *With approved credit. Monthly payment may vary slightly.
            We do not accept cash. Check or Money Orders must be used for cash discount.
          </p>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-700 rounded focus:ring-blue-500" />
              <span className="text-sm text-gray-700">
                I have read and accept the AiRCO Mechanical Service Agreement{' '}
                <button className="text-blue-700 underline">View Terms</button>
              </span>
            </label>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type your full name to sign
              </label>
              <input type="text" value={signature} onChange={e => setSignature(e.target.value)}
                placeholder="Full legal name"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                style={{ fontFamily: 'cursive', fontSize: '1.25rem' }} />
            </div>

            <button onClick={handleComplete} disabled={!canComplete}
              className="mt-6 w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-4 font-semibold text-lg transition-colors">
              Complete & Schedule Installation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
