import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import OptionCard from '../components/OptionCard';
import InstallInclusions from '../components/InstallInclusions';
import ProgressBar from '../components/ProgressBar';
import OptionDetail from './OptionDetail';
import { matchOptions } from '../utils/matchingEngine';
import { fireTrigger } from '../utils/formatters';

export default function ProposalComparison() {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [estimate, setEstimate] = useState(null);
  const [options, setOptions] = useState([]);
  const [detailOption, setDetailOption] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveSelection, setApproveSelection] = useState(null);
  const viewedRef = useRef(false);

  const urlOptionIds = searchParams.getAll('options');

  useEffect(() => {
    fetch(`/api/estimates/${estimateId}`)
      .then(r => r.json())
      .then(data => {
        if (data.estimate) {
          setEstimate(data.estimate);
          setReviewEmail(data.estimate.homeowner?.email || '');
          const matched = matchOptions(
            data.estimate.jobDetails.tonnage,
            data.estimate.jobDetails.systemType,
            data.estimate.jobDetails.fuelType
          );
          // Filter to only URL-specified options, or show all if none specified
          if (urlOptionIds.length > 0) {
            setOptions(matched.filter(o => urlOptionIds.includes(o.id)));
          } else {
            setOptions(matched);
          }

          // Fire viewed trigger once
          if (!data.estimate.viewedAt && !viewedRef.current) {
            viewedRef.current = true;
            fetch(`/api/estimates/${estimateId}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'opened' })
            });
            fireTrigger(estimateId, 'estimate_viewed');
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [estimateId]);

  const handleCompareToggle = (option) => {
    setCompareIds(prev =>
      prev.includes(option.id)
        ? prev.filter(id => id !== option.id)
        : [...prev, option.id]
    );
  };

  const handleViewPricing = () => {
    const params = new URLSearchParams();
    compareIds.forEach(id => params.append('options', id));
    navigate(`/proposal/${estimateId}/pricing?${params.toString()}`);
  };

  const handleApproveSign = () => {
    if (compareIds.length === 1) {
      navigate(`/proposal/${estimateId}/terms?option=${compareIds[0]}`);
    } else {
      // No boxes checked — show modal with all options
      setApproveSelection(null);
      setShowApproveModal(true);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-lg">Estimate not found.</p>
      </div>
    );
  }

  const { homeowner } = estimate;

  return (
    <div className="min-h-screen bg-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-medium
          ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-6">
        <div className="max-w-7xl mx-auto text-center">
          <img src="/airco-logo.png" alt="AiRCO Mechanical" className="h-12 mx-auto mb-2" onError={(e) => { e.target.style.display='none'; }} />
          <p className="text-sm text-gray-500 italic">Comfort in Simplicity</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>

        <ProgressBar currentStep={0} />

        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Hi {homeowner.firstName}, here are your options for {homeowner.address}.
          </h1>
          <p className="text-gray-500 text-lg">
            We've matched {options.length} system{options.length !== 1 ? 's' : ''} to your home. Take your time — there's no rush.
          </p>
        </div>

        {/* Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {options.map(opt => (
            <OptionCard
              key={opt.id}
              option={opt}
              isSelected={compareIds.includes(opt.id)}
              onSelect={handleCompareToggle}
              onLearnMore={setDetailOption}
            />
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="max-w-xl mx-auto mb-12 space-y-4">
          {compareIds.length >= 1 && (
            <button
              onClick={handleViewPricing}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 py-4 font-semibold text-lg transition-colors"
            >
              View Pricing Comparison ({compareIds.length} system{compareIds.length > 1 ? 's' : ''} selected)
            </button>
          )}
          {compareIds.length < 2 && (
            <button
              onClick={handleApproveSign}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 py-4 font-semibold text-lg transition-colors"
            >
              Approve &amp; Sign on the Spot
            </button>
          )}
          <div className="text-center">
            <button
              onClick={() => setShowReviewModal(true)}
              className="text-gray-400 hover:text-gray-600 text-sm underline transition-colors bg-transparent border-none cursor-pointer"
            >
              Send options for remote review &rarr;
            </button>
          </div>
        </div>

        {/* Performance Guarantees */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">10-YEAR "NO LEMON" HEATING GUARANTEE</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Should your heat exchanger fail within the first ten (10) years of installation,
                we will replace the entire furnace at no cost. Requires reasonable access to equipment.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">5-YEAR "NO LEMON" COOLING GUARANTEE</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Should your cooling system or heat pump compressor fail two (2) times within the first five (5) years
                of installation, we will replace the entire unit at no cost. Requires reasonable access to equipment.
              </p>
            </div>
          </div>
        </div>

        <InstallInclusions />

        <div className="text-center mt-8">
          <p className="text-gray-500">
            Most homeowners finance. See your options after selecting a system.
          </p>
        </div>

      </div>

      {/* Send for Remote Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowReviewModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Send for Remote Review</h2>
            <label className="block text-sm font-medium text-gray-700 mb-1">Homeowner Email</label>
            <input
              type="email"
              value={reviewEmail}
              onChange={e => setReviewEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
            <textarea
              value={reviewMessage}
              onChange={e => setReviewMessage(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add a personal note..."
            />
            <button
              onClick={() => {
                setShowReviewModal(false);
                setToast({ type: 'success', message: `Sent to ${reviewEmail} via email and SMS` });
                setTimeout(() => setToast(null), 3000);
              }}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 py-3 font-semibold text-lg transition-colors"
            >
              Send Now
            </button>
          </div>
        </div>
      )}

      {/* Approve & Sign Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowApproveModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowApproveModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Which system would you like to approve?</h2>
            <div className="space-y-3 mb-6">
              {options.map(opt => (
                <label key={opt.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-400 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="approve-option"
                    checked={approveSelection === opt.id}
                    onChange={() => setApproveSelection(opt.id)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{opt.systemName}</p>
                    <p className="text-sm text-gray-500">{opt.tier} &bull; {opt.efficiency} SEER2</p>
                  </div>
                </label>
              ))}
            </div>
            <button
              disabled={!approveSelection}
              onClick={() => {
                setShowApproveModal(false);
                navigate(`/proposal/${estimateId}/terms?option=${approveSelection}`);
              }}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 font-semibold text-lg transition-colors"
            >
              Continue to Sign
            </button>
          </div>
        </div>
      )}

      {/* Option Detail Modal */}
      {detailOption && (
        <OptionDetail
          option={detailOption}
          onClose={() => setDetailOption(null)}
          onSelect={handleCompareToggle}
        />
      )}
    </div>
  );
}
