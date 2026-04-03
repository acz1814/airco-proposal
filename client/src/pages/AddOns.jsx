import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AddOnItem from '../components/AddOnItem';
import ProgressBar from '../components/ProgressBar';
import { addons as allAddons } from '../data/addons';
import { matchOptions } from '../utils/matchingEngine';
import { formatCurrency } from '../utils/formatters';

const iaqItems = [
  { id: 'iaq-prefilter', name: 'Pre Filter Ionizer' },
  { id: 'iaq-media', name: 'Media Filter' },
  { id: 'iaq-germicidal', name: 'Germicidal Light (per bulb)' },
  { id: 'iaq-purifier', name: 'Air Purifier' },
];

export default function AddOns() {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedOption, setSelectedOption] = useState(location.state?.selectedOption || null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [estimate, setEstimate] = useState(null);
  const [iaqSelections, setIaqSelections] = useState({});
  const [iaqPrices, setIaqPrices] = useState({});

  useEffect(() => {
    if (!selectedOption) {
      fetch(`/api/estimates/${estimateId}`)
        .then(r => r.json())
        .then(data => {
          if (data.estimate) {
            setEstimate(data.estimate);
            if (data.estimate.selectedOptionId) {
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
    }
  }, [estimateId, selectedOption]);

  const toggleAddon = (id) => {
    setSelectedAddons(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const selectedAddonItems = allAddons.filter(a => selectedAddons.includes(a.id));
  const addonTotal = selectedAddonItems.reduce((sum, a) => sum + a.price, 0);
  const addonMonthly = selectedAddonItems.reduce((sum, a) => sum + a.monthlyAddition, 0);
  const iaqTotal = iaqItems.reduce((sum, item) => {
    if (iaqSelections[item.id] && iaqPrices[item.id]) return sum + (parseFloat(iaqPrices[item.id]) || 0);
    return sum;
  }, 0);
  const basePrice = selectedOption?.totalPrice || 0;
  const rebate = selectedOption?.rebates || 0;
  const total = basePrice + addonTotal + iaqTotal - rebate;
  const monthly = (selectedOption?.monthlyPayment || 0) + addonMonthly;

  // Group addons by category
  const categories = [...new Set(allAddons.map(a => a.category))];

  const handleContinue = () => {
    navigate(`/proposal/${estimateId}/checkout`, {
      state: { selectedOption, selectedAddons, addonTotal, addonMonthly }
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

        <ProgressBar currentStep={2} />

        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Upgrade Your System (Optional)
          </h1>
          <p className="text-gray-500">
            Selected: <span className="font-semibold text-gray-900">{selectedOption.systemName}</span> — Base price: {formatCurrency(basePrice)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add-on cards */}
          <div className="lg:col-span-2 space-y-8">
            {/* IAQ Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Optional Indoor Air Quality (IAQ)</h2>
              <img src="/airco-iaq-diagram.png" alt="IAQ System" className="w-full max-w-2xl mx-auto my-4 rounded-xl"
                onError={(e) => { e.target.style.display = 'none'; }} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {iaqItems.map(item => (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!iaqSelections[item.id]}
                        onChange={() => setIaqSelections(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                        className="w-4 h-4 text-blue-700 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Price"
                      value={iaqPrices[item.id] || ''}
                      onChange={e => setIaqPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {categories.map(cat => (
              <div key={cat}>
                <h2 className="text-lg font-bold text-gray-900 mb-4">{cat}</h2>
                {cat === 'Air Quality' && (
                  <img src="/airco-iaq-diagram.png" alt="Indoor Air Quality System"
                    className="w-full max-w-2xl mx-auto my-4 rounded-xl"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="space-y-3">
                  {allAddons.filter(a => a.category === cat).map(addon => (
                    <AddOnItem
                      key={addon.id}
                      addon={addon}
                      isSelected={selectedAddons.includes(addon.id)}
                      onToggle={toggleAddon}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Running total sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Selection</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">{selectedOption.systemName}</span>
                  <span className="font-semibold">{formatCurrency(basePrice)}</span>
                </div>
                {selectedAddonItems.map(addon => (
                  <div key={addon.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{addon.name}</span>
                    <span className="font-medium">+{formatCurrency(addon.price)}</span>
                  </div>
                ))}
                {iaqItems.filter(item => iaqSelections[item.id] && iaqPrices[item.id]).map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-medium">+{formatCurrency(parseFloat(iaqPrices[item.id]) || 0)}</span>
                  </div>
                ))}
                {rebate > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Rebate</span>
                    <span>-{formatCurrency(rebate)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</span>
                </div>
                <p className="text-sm text-blue-700 font-semibold text-right mt-1">
                  As low as {formatCurrency(monthly)}/mo
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <button onClick={handleContinue}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 py-3 font-semibold transition-colors">
                  Continue to Checkout
                </button>
                <button onClick={handleContinue}
                  className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl px-6 py-3 font-semibold transition-colors">
                  Continue Without Upgrades
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
