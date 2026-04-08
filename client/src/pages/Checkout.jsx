import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import { matchOptions } from '../utils/matchingEngine';
import { formatCurrency, fireTrigger } from '../utils/formatters';
import * as estimateStorage from '../utils/estimateStorage';

export default function Checkout() {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedOption, setSelectedOption] = useState(location.state?.selectedOption || null);
  const [estimate, setEstimate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState(false);

  // Payment state — value is the canonical key sent to the server
  const [paymentMethod, setPaymentMethod] = useState('deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [financingProvider, setFinancingProvider] = useState('');
  const [applicationNumber, setApplicationNumber] = useState('');

  // Customize data from estimate-scoped storage
  estimateStorage.setActiveEstimate(estimateId);
  const customizeData = estimateStorage.getJSON('customize_data', {}) || {};
  const summaryData = estimateStorage.getJSON('customize_summary', {}) || {};
  const iaqTotal = customizeData.iaqIncluded ? (customizeData.iaqAfterDiscount || 0) : 0;
  const miscTotal = customizeData.miscIncluded ? (customizeData.miscAfterDiscount || 0) : 0;

  useEffect(() => {
    fetch(`/api/estimates/${estimateId}`)
      .then(r => r.json())
      .then(data => {
        if (data.estimate) {
          setEstimate(data.estimate);
          if (!selectedOption) {
            const options = matchOptions(
              data.estimate.jobDetails.tonnage,
              data.estimate.jobDetails.systemType,
              data.estimate.jobDetails.fuelType
            );
            const opt = options.find(o => o.id === data.estimate.selectedOptionId);
            if (opt) setSelectedOption(opt);
          }
        }
      });
  }, [estimateId, selectedOption]);

  const systemPrice = selectedOption?.totalPrice || 0;
  const grandTotal = summaryData.totalInvestmentAfterDiscount || (systemPrice + iaqTotal + miscTotal);

  // Default deposit to 50% of grand total
  const effectiveDeposit = depositAmount !== '' ? (parseFloat(depositAmount) || 0) : Math.round(grandTotal * 0.5);

  const chargeAmount =
    paymentMethod === 'pay_in_full' ? grandTotal :
    paymentMethod === 'deposit' ? effectiveDeposit :
    0;
  const paymentStatus =
    paymentMethod === 'pay_in_full' ? 'paid_in_full' :
    paymentMethod === 'deposit' ? 'deposit_paid' :
    'pending';

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
    // Persist signed-agreement record for the Confirmation receipt
    estimateStorage.setItem('signature', {
      signerName: location.state?.signature || '',
      initials: location.state?.initials || '',
      timestamp: new Date().toISOString(),
    });
    await new Promise(resolve => setTimeout(resolve, 1500));

    await fetch(`/api/estimates/${estimateId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedOptionId: selectedOption?.id,
        subtotal: systemPrice,
        iaqTotal,
        miscTotal,
        finalTotal: grandTotal,
        paymentMethod,
        paymentStatus,
        depositAmount: chargeAmount,
        paymentId: `mock_pi_${Date.now().toString(36)}`,
        signature: location.state?.signature || ''
      })
    });

    await fireTrigger(estimateId, 'payment_completed', {
      method: paymentMethod,
      paymentMethod,
      amount: chargeAmount,
      paymentAmount: chargeAmount,
      financingProvider: paymentMethod === 'financing' ? financingProvider : '',
      applicationNumber: paymentMethod === 'financing' ? applicationNumber : '',
    });
    await fireTrigger(estimateId, 'estimate_accepted');

    // Send mock receipt email
    setSendingReceipt(true);
    const netInvestmentData = estimateStorage.getJSON('net_investment', {}) || {};
    const cardDigits = cardNumber.replace(/\D/g, '');
    const homeownerEmail = estimate?.homeowner?.email || '';
    const homeownerName = `${estimate?.homeowner?.firstName || ''} ${estimate?.homeowner?.lastName || ''}`.trim();
    const jobAddress = [
      estimate?.homeowner?.address,
      estimate?.homeowner?.city,
      estimate?.homeowner?.state,
      estimate?.homeowner?.zip
    ].filter(Boolean).join(', ');

    await fetch('/api/send-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeownerName,
        homeownerEmail,
        address: jobAddress,
        systemName: summaryData.systemName || selectedOption?.systemName || '',
        tier: summaryData.tier || selectedOption?.tier || '',
        seer2: summaryData.seer2 || selectedOption?.efficiency || '',
        warranty: summaryData.warranty || (selectedOption?.warranty ? `${selectedOption.warranty.parts} Parts / ${selectedOption.warranty.labor} Labor` : ''),
        systemCost: summaryData.systemCost || systemPrice,
        iaqItems: summaryData.iaqItems || 0,
        totalDiscount: summaryData.totalDiscount || 0,
        totalInvestmentAfterDiscount: summaryData.totalInvestmentAfterDiscount || grandTotal,
        netInvestment: netInvestmentData.netInvestment || grandTotal,
        apr0Monthly: summaryData.apr0Monthly || 0,
        apr699Monthly: summaryData.apr699Monthly || 0,
        apr0Years: summaryData.apr0Years || 0,
        paymentMethod,
        depositAmount: chargeAmount,
        cardLast4: cardDigits.length >= 4 ? cardDigits.slice(-4) : '',
        initials: location.state?.initials || '',
        signature: location.state?.signature || '',
        signatureTimestamp: new Date().toISOString()
      })
    });
    setSendingReceipt(false);

    console.log('SUBMITTING — paymentMethod:', paymentMethod, 'chargeAmount:', chargeAmount);
    navigate(`/proposal/${estimateId}/confirm`, {
      state: {
        selectedOption,
        finalTotal: grandTotal,
        paymentMethod,
        chargeAmount,
        homeownerEmail,
      }
    });
    } catch (err) {
      console.error('Checkout completion error', err);
      setSendingReceipt(false);
      navigate(`/proposal/${estimateId}/confirm`, {
        state: {
          selectedOption,
          finalTotal: grandTotal,
          paymentMethod,
          chargeAmount,
          homeownerEmail: estimate?.homeowner?.email || '',
        }
      });
    }
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
            onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(`/proposal/${estimateId}/customize?option=${selectedOption?.id || ''}`)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors mb-4"
          style={{ padding: '16px' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back to Proposal</span>
        </button>

        <ProgressBar currentStep={3} />

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight text-center mb-8">Checkout</h1>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <div>
                <p className="font-semibold text-gray-900">{selectedOption.systemName}</p>
                <p className="text-sm text-gray-500">{selectedOption.tier} &middot; {selectedOption.efficiency}</p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">System Cost</span>
              <span className="font-medium">{formatCurrency(summaryData.systemCost || systemPrice)}</span>
            </div>
            {(summaryData.iaqItems || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IAQ Items</span>
                <span className="font-medium">+{formatCurrency(summaryData.iaqItems)}</span>
              </div>
            )}
            {(summaryData.totalDiscount || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discounts Applied</span>
                <span className="font-medium text-green-600">-{formatCurrency(summaryData.totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="text-xl font-bold text-gray-900">Grand Total</span>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>

          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-400 cursor-pointer transition-colors">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'deposit'}
                onChange={() => setPaymentMethod('deposit')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-medium text-gray-900">Pay Deposit Now</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-400 cursor-pointer transition-colors">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'pay_in_full'}
                onChange={() => setPaymentMethod('pay_in_full')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-medium text-gray-900">Pay in Full Now</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-400 cursor-pointer transition-colors">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'bill_on_completion'}
                onChange={() => setPaymentMethod('bill_on_completion')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-medium text-gray-900">Bill on Completion</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-400 cursor-pointer transition-colors">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'financing'}
                onChange={() => setPaymentMethod('financing')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-medium text-gray-900">Financing</span>
            </label>
          </div>

          {paymentMethod === 'financing' && (
            <div className="space-y-4 mb-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFinancingProvider('goodleap')}
                  className={`px-4 py-3 rounded-lg border font-semibold transition-colors ${
                    financingProvider === 'goodleap'
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  GoodLeap
                </button>
                <button
                  type="button"
                  onClick={() => setFinancingProvider('service_finance')}
                  className={`px-4 py-3 rounded-lg border font-semibold transition-colors ${
                    financingProvider === 'service_finance'
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  Service Finance
                </button>
              </div>
              {financingProvider === 'goodleap' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Number</label>
                  <input
                    type="text"
                    value={applicationNumber}
                    onChange={e => setApplicationNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}
              {financingProvider === 'service_finance' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Number</label>
                  <input
                    type="text"
                    value={applicationNumber}
                    onChange={e => setApplicationNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {(paymentMethod === 'deposit' || paymentMethod === 'pay_in_full') && (
            <div className="space-y-4">
              {paymentMethod === 'deposit' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount</label>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      value={depositAmount !== '' ? depositAmount : Math.round(grandTotal * 0.5)}
                      onChange={e => setDepositAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Payment Amount</label>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">$</span>
                    <input
                      type="text"
                      readOnly
                      value={grandTotal}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="XXXX XXXX XXXX XXXX"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="CVV"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    maxLength={4}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                <input
                  type="text"
                  value={nameOnCard}
                  onChange={e => setNameOnCard(e.target.value)}
                  placeholder="Full name as shown on card"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Complete Purchase */}
        <button
          onClick={handleComplete}
          disabled={submitting || sendingReceipt}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-4 font-semibold text-lg transition-colors mb-8"
        >
          {sendingReceipt ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending receipt...
            </span>
          ) : submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : 'Complete Purchase'}
        </button>
      </div>
    </div>
  );
}
