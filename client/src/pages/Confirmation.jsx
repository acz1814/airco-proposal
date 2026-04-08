import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';
import { matchOptions } from '../utils/matchingEngine';
import ProgressBar from '../components/ProgressBar';
import * as estimateStorage from '../utils/estimateStorage';

export default function Confirmation() {
  const { estimateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState(null);
  const [selectedOption, setSelectedOption] = useState(location.state?.selectedOption || null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [ccEmail, setCcEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  estimateStorage.setActiveEstimate(estimateId);
  const summaryData = estimateStorage.getJSON('customize_summary', {}) || {};
  const netInvestmentData = estimateStorage.getJSON('net_investment', {}) || {};
  const customizeData = estimateStorage.getJSON('customize_form', {}) || {};
  const signatureRecord = estimateStorage.getJSON('signature', {}) || {};
  const stage2State = estimateStorage.getJSON('stage2_state', {}) || {};
  const photoDataUrls = (() => {
    const p = estimateStorage.getJSON('photos', []);
    return Array.isArray(p) ? p.filter(Boolean) : [];
  })();

  const iaqLabelByKey = {
    preFilter: 'Pre Filter Ionizer',
    mediaFilter: 'Media Filter',
    germicidalLight: 'Germicidal Light (per bulb)',
    airPurifier: 'Air Purifier',
  };
  const iaqLineItems = customizeData.iaqIncluded
    ? Object.keys(iaqLabelByKey)
        .filter(k => customizeData.iaqChecked?.[k])
        .map(k => ({
          key: k,
          label: iaqLabelByKey[k],
          price: parseFloat(customizeData.iaqPrices?.[k]) || 0,
        }))
    : [];

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/estimates/${estimateId}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data?.estimate) return;
        setEstimate(data.estimate);
        if (!selectedOption && data.estimate.selectedOptionId && data.estimate.jobDetails) {
          try {
            const options = matchOptions(
              data.estimate.jobDetails.tonnage,
              data.estimate.jobDetails.systemType,
              data.estimate.jobDetails.fuelType
            );
            const opt = options.find(o => o.id === data.estimate.selectedOptionId);
            if (opt) setSelectedOption(opt);
          } catch {}
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [estimateId]);

  const firstName = estimate?.homeowner?.firstName || 'Homeowner';
  const lastName = estimate?.homeowner?.lastName || '';
  const homeownerFullName = `${firstName} ${lastName}`.trim();
  const homeownerEmail = estimate?.homeowner?.email || location.state?.homeownerEmail || '';
  const finalTotal = estimate?.finalTotal || location.state?.finalTotal || 0;
  const chargeAmount = location.state?.chargeAmount;
  const paymentMethod = location.state?.paymentMethod || estimate?.paymentMethod || 'deposit';
  const monthlyPayment = estimate?.monthlyPayment || location.state?.monthlyPayment;

  const systemName = summaryData.systemName || selectedOption?.systemName || '';
  const tier = summaryData.tier || selectedOption?.tier || '';
  const totalAfterDiscounts = netInvestmentData.totalAfterDiscounts ?? summaryData.systemCost ?? 0;
  const optId = selectedOption?.id;
  const mfrRebate = optId ? (parseFloat(stage2State.mfrRebates?.[optId]) || 0) : 0;
  const utilityRebate = optId ? (parseFloat(stage2State.utilityRebates?.[optId]) || 0) : 0;
  const netInvestment = netInvestmentData.netInvestment ?? Math.max(0, totalAfterDiscounts - mfrRebate - utilityRebate);

  const formatSignedTimestamp = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return `Signed on ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } catch { return ''; }
  };
  const signedAgreement = {
    signerName: signatureRecord.signerName || homeownerFullName,
    initials: signatureRecord.initials || '',
    timestamp: signatureRecord.timestamp || '',
    systemName: `${systemName}${tier ? ' — ' + tier : ''}`,
    legalNote: 'Electronic signature captured in accordance with UETA and E-SIGN Act',
  };

  const paymentMethodLabel =
    paymentMethod === 'pay_in_full' ? 'Paid in Full' :
    paymentMethod === 'bill_on_completion' ? 'Bill on Completion' :
    'Deposit';

  const totalRowLabel =
    paymentMethod === 'deposit' ? 'Deposit Charged' :
    paymentMethod === 'bill_on_completion' ? 'Amount Due on Completion' :
    'Total';
  const totalRowAmount =
    paymentMethod === 'deposit' ? (chargeAmount ?? 0) : finalTotal;

  const handleSendReceipt = async () => {
    setSending(true);
    try {
      await fetch('/api/ghl/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimateId,
          homeownerEmail,
          ccEmail: ccEmail || null,
          homeownerName: homeownerFullName,
          systemName,
          tier,
          totalAfterDiscounts,
          iaqItems: iaqLineItems,
          grandTotal: finalTotal,
          paymentMethod: paymentMethodLabel,
          netInvestment,
          mfrRebate,
          utilityRebate,
          signedAgreement,
          photoDataUrls,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {}
    setSending(false);
    setShowReceiptModal(false);
    setToast({ type: 'success', message: `Receipt sent to ${homeownerEmail}` });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12 md:py-20 text-center">
        <ProgressBar currentStep={4} />

        {/* Green checkmark animation */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce-once">
            <svg className="w-12 h-12 text-green-600 checkmark-animate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-2">
          You're All Set, {firstName}!
        </h1>
        {location.state?.homeownerEmail && (
          <p className="text-sm text-gray-500 mb-4">
            A receipt has been sent to {location.state.homeownerEmail}
          </p>
        )}

        {/* Summary */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Selection</h2>
          {selectedOption && (
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">{selectedOption.systemName}</span>
              <span className="font-semibold">{selectedOption.tier}</span>
            </div>
          )}
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">{totalRowLabel}</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(totalRowAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment</span>
            <span className="font-medium text-gray-900">{paymentMethodLabel}</span>
          </div>
        </div>

        {/* Next steps */}
        <div className="text-left mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">What Happens Next</h2>
          <div className="space-y-4">
            {[
              { step: '1', text: "You'll receive a confirmation email within 5 minutes" },
              { step: '2', text: 'Our scheduling team will call you within 24 hours' },
              { step: '3', text: 'Installation typically takes 4–6 hours' }
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                  {item.step}
                </div>
                <p className="text-gray-700 pt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <button
            onClick={() => setShowReceiptModal(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-8 py-3 font-semibold transition-colors"
          >
            Email Customer Receipt
          </button>
          <button
            onClick={() => {
              estimateStorage.clearEstimate(estimateId);
              navigate('/tech');
            }}
            className="border-2 border-blue-700 text-blue-700 hover:bg-blue-50 rounded-xl px-8 py-3 font-semibold transition-colors"
          >
            Return to Dashboard
          </button>
        </div>

        {/* Logo */}
        <div className="mb-6">
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

        {/* Contact footer */}
        <div className="border-t border-gray-200 pt-6 text-sm text-gray-500 space-y-2">
          <p>
            Questions? <span className="font-medium text-gray-700">512-454-COOL</span>
            {' | '}
            <span className="font-medium text-gray-700">info@aircoaustin.com</span>
            {' | '}
            <span className="font-medium text-blue-700">www.aircoaustin.com</span>
          </p>
          <p>1000 South IH-35, Round Rock, TX 78681</p>
          <p className="text-xs text-gray-400 mt-4">
            AC TACLA51950C | Plumbing M37961 | Electrical TECL35427 | Regulated by Texas Department of Licensing and Regulation
          </p>
        </div>
      </div>

      {/* Success Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-medium bg-green-600">
          {toast.message}
        </div>
      )}

      {/* Email Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto p-4" onClick={() => setShowReceiptModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Email Customer Receipt</h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-5 space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input type="email" value={homeownerEmail} readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CC (optional)</label>
                <input type="email" value={ccEmail} onChange={e => setCcEmail(e.target.value)}
                  placeholder="office@aircoaustin.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input type="text" readOnly
                  value={`Your AiRCO Mechanical Receipt — ${systemName}`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700 outline-none" />
              </div>

              {/* Receipt Preview */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 max-h-96 overflow-y-auto">
                <p className="text-xs uppercase font-bold text-gray-500 mb-2">Message Preview</p>
                <p className="text-sm text-gray-900 font-semibold mb-1">{homeownerFullName}</p>
                <p className="text-sm text-gray-700 mb-3">{systemName} — {tier}</p>

                <div className="space-y-1 text-sm border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total After Discounts</span>
                    <span className="font-semibold">{formatCurrency(totalAfterDiscounts)}</span>
                  </div>
                  {iaqLineItems.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs uppercase font-bold text-gray-500 mt-2 mb-1">IAQ Items</p>
                      {iaqLineItems.map(item => (
                        <div key={item.key} className="flex justify-between">
                          <span className="text-gray-600">{item.label}</span>
                          <span>{formatCurrency(item.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-900">Grand Total</span>
                    <span className="font-bold text-gray-900">{formatCurrency(finalTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium">{paymentMethodLabel}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-xs uppercase font-bold text-gray-500 mb-2">Rebates &amp; Incentives (applied after purchase)</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Manufacturer Rebate</span>
                      <span className="text-green-700">-{formatCurrency(mfrRebate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Utility Rebate</span>
                      <span className="text-green-700">-{formatCurrency(utilityRebate)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                      <span className="font-semibold text-gray-900">Net Investment after rebates</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(netInvestment)}</span>
                    </div>
                  </div>
                  <p className="text-xs italic text-gray-500 mt-2">
                    Rebates are not deducted at time of purchase. Manufacturer rebate is mailed directly to customer. Utility rebate is credited on first utility bill.
                  </p>
                </div>

                {/* Signed Agreement */}
                <div className="mt-4 border-2 border-blue-300 rounded-lg p-3 bg-white">
                  <p className="text-xs uppercase font-bold text-blue-700 mb-2">Signed Agreement</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Homeowner</span>
                      <span className="font-medium text-gray-900">{signedAgreement.signerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Initials</span>
                      <span className="font-medium text-gray-900">{signedAgreement.initials}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">System</span>
                      <span className="font-medium text-gray-900">{signedAgreement.systemName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timestamp</span>
                      <span className="font-medium text-gray-900">{formatSignedTimestamp(signedAgreement.timestamp)}</span>
                    </div>
                  </div>
                  <p className="text-xs italic text-gray-500 mt-2">{signedAgreement.legalNote}</p>
                </div>

                {photoDataUrls.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs uppercase font-bold text-gray-500 mb-2">Job Site Photos</p>
                    <div className="grid grid-cols-3 gap-2">
                      {photoDataUrls.map((src, i) => (
                        <img key={i} src={src} alt={`Site ${i + 1}`} className="w-full h-20 object-cover rounded-lg" />
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
                  <p>512-454-COOL | info@aircoaustin.com | www.aircoaustin.com</p>
                  <p>1000 South IH-35, Round Rock TX 78681</p>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-600 hover:text-gray-800 px-5 py-2 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReceipt}
                disabled={sending || !homeownerEmail}
                className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl px-6 py-2.5 font-semibold transition-colors"
              >
                {sending ? 'Sending...' : 'Send Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-once {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out forwards;
        }
        @keyframes draw-check {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .checkmark-animate {
          stroke-dasharray: 24;
          animation: draw-check 0.4s 0.3s ease-out forwards;
          stroke-dashoffset: 24;
        }
      `}</style>
    </div>
  );
}
