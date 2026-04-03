import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OptionCard from '../components/OptionCard';
import InstallInclusions from '../components/InstallInclusions';
import ProgressBar from '../components/ProgressBar';
import OptionDetail from './OptionDetail';
import { matchOptions } from '../utils/matchingEngine';
import { fireTrigger } from '../utils/formatters';

export default function ProposalComparison() {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState(null);
  const [options, setOptions] = useState([]);
  const [detailOption, setDetailOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const viewedRef = useRef(false);

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
          setOptions(matched);

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

  const handleSelect = async (option) => {
    await fetch(`/api/estimates/${estimateId}/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId: option.id })
    });
    await fireTrigger(estimateId, 'option_selected', { optionId: option.id });
    navigate(`/proposal/${estimateId}/addons`, { state: { selectedOption: option } });
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
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-6">
        <div className="max-w-7xl mx-auto text-center">
          <img src="/airco-logo.png" alt="AiRCO Mechanical" className="h-12 mx-auto mb-2" onError={(e) => { e.target.style.display='none'; }} />
          <p className="text-sm text-gray-500 italic">Comfort in Simplicity</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        <ProgressBar currentStep={0} />

        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Hi {homeowner.firstName}, here are your options for {homeowner.address}.
          </h1>
          <p className="text-gray-500 text-lg">
            We've matched 4 systems to your home. Take your time — there's no rush.
          </p>
        </div>

        {/* Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          {options.map(opt => (
            <OptionCard
              key={opt.id}
              option={opt}
              isSelected={false}
              onSelect={handleSelect}
              onLearnMore={setDetailOption}
            />
          ))}
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

      {/* Option Detail Modal */}
      {detailOption && (
        <OptionDetail
          option={detailOption}
          onClose={() => setDetailOption(null)}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
