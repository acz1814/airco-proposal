import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';
import { matchOptions } from '../utils/matchingEngine';
import ProgressBar from '../components/ProgressBar';

export default function Confirmation() {
  const { estimateId } = useParams();
  const location = useLocation();
  const [estimate, setEstimate] = useState(null);
  const [selectedOption, setSelectedOption] = useState(location.state?.selectedOption || null);

  useEffect(() => {
    fetch(`/api/estimates/${estimateId}`)
      .then(r => r.json())
      .then(data => {
        if (data.estimate) {
          setEstimate(data.estimate);
          if (!selectedOption && data.estimate.selectedOptionId) {
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

  const firstName = estimate?.homeowner?.firstName || 'Homeowner';
  const finalTotal = estimate?.finalTotal || location.state?.finalTotal || 0;
  const paymentMethod = estimate?.paymentMethod || location.state?.paymentMethod;
  const monthlyPayment = estimate?.monthlyPayment || location.state?.monthlyPayment;

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
            <span className="text-gray-600">Total</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(finalTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment</span>
            <span className="font-medium text-gray-900">
              {paymentMethod === 'financing'
                ? `Financing — ${formatCurrency(monthlyPayment)}/mo`
                : 'Paid in Full'}
            </span>
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

        <button className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-8 py-3 font-semibold transition-colors mb-12">
          Save Your Receipt
        </button>

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
            Questions? Call <span className="font-medium text-gray-700">512-454-COOL (2665)</span> or visit{' '}
            <span className="font-medium text-blue-700">www.aircoaustin.com</span>
          </p>
          <p>1000 South IH-35, Round Rock, TX 78681</p>
          <p className="text-xs text-gray-400 mt-4">
            AC TACLA51950C | Plumbing M37961 | Electrical TECL35427 | Regulated by Texas Department of Licensing and Regulation
          </p>
        </div>
      </div>

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
