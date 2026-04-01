import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AddOnItem from '../components/AddOnItem';
import ProgressBar from '../components/ProgressBar';
import { addons as allAddons } from '../data/addons';
import { matchOptions } from '../utils/matchingEngine';
import { formatCurrency } from '../utils/formatters';

export default function AddOns() {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedOption, setSelectedOption] = useState(location.state?.selectedOption || null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [estimate, setEstimate] = useState(null);

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
  const basePrice = selectedOption?.totalPrice || 0;
  const rebate = selectedOption?.rebates || 0;
  const total = basePrice + addonTotal - rebate;
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
