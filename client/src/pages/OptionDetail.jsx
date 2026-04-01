import { formatCurrency, formatMonthly } from '../utils/formatters';
import { calculateMonthlyPayment } from '../utils/matchingEngine';
import { financingPlans } from '../data/financing';
import { addons as allAddons } from '../data/addons';
import InstallInclusions from '../components/InstallInclusions';

const comfortExplanations = {
  Good: "This system uses a single-stage compressor, which means it runs at full capacity whenever it's on. It's reliable and straightforward — a solid choice for homeowners who want dependable cooling without the extra cost.",
  Better: "This two-stage system can run at a lower speed most of the time and ramp up only when needed. That means more even temperatures, less noise, and better humidity control compared to a single-stage unit.",
  Best: "This variable-speed system continuously adjusts its output to match the exact cooling load your home needs. It runs quietly at low power most of the time, delivering precise comfort with maximum energy savings.",
  Premium: "This is our most advanced system. It combines ultra-variable-speed technology with built-in air purification. It whispers when it runs, keeps every room at the exact temperature you want, and actively cleans your indoor air."
};

const specFields = {
  Good: { stage: 'Single-Stage', compressor: 'Standard Scroll', refrigerant: 'R-410A' },
  Better: { stage: 'Two-Stage', compressor: 'Two-Stage Scroll', refrigerant: 'R-410A' },
  Best: { stage: 'Variable-Speed', compressor: 'Inverter-Driven', refrigerant: 'R-32' },
  Premium: { stage: 'Ultra-Variable', compressor: 'Ultra-Variable Inverter', refrigerant: 'R-32' }
};

export default function OptionDetail({ option, onClose, onSelect }) {
  if (!option) return null;

  const specs = specFields[option.tier] || specFields.Good;
  const popularAddons = allAddons.filter(a => a.popular).slice(0, 3);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <span className="text-sm font-bold text-blue-700 uppercase">{option.tier}</span>
            <h2 className="text-xl font-bold text-gray-900">{option.systemName}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* 1. System Overview */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">System Overview</h3>
            <p className="text-gray-600 leading-relaxed">
              The {option.systemName} is a {option.tonnage}-ton {option.efficiency} system designed for whole-home comfort.
              It pairs the {option.indoor} air handler with the {option.outdoor} outdoor unit for reliable, efficient cooling.
            </p>
          </section>

          {/* 2. Equipment Specs */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Equipment Specs</h3>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Tonnage', `${option.tonnage} Ton`],
                    ['SEER2 Rating', option.efficiency],
                    ['Refrigerant', specs.refrigerant],
                    ['Stage', specs.stage],
                    ['Compressor', specs.compressor]
                  ].map(([label, value], i) => (
                    <tr key={label} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-2.5 font-medium text-gray-700">{label}</td>
                      <td className="px-4 py-2.5 text-gray-900">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Comfort Explanation */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Comfort Explanation</h3>
            <p className="text-gray-600 leading-relaxed">{comfortExplanations[option.tier]}</p>
          </section>

          {/* 4. Full Warranty */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Full Warranty</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Parts', value: option.warranty.parts },
                { label: 'Labor', value: option.warranty.labor },
                { label: 'Compressor', value: option.warranty.compressor }
              ].map(w => (
                <div key={w.label} className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-500">{w.label}</p>
                  <p className="text-lg font-bold text-blue-700">{w.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              Any labor warranty period past 12 months from the day of installation completion
              requires a minimum of one annual preventative maintenance performed by AiRCO.
              The first annual maintenance visit must be performed within 24 months of installation.
              Failure to meet this requirement will result in cancellation of your Labor Warranty.
            </p>
          </section>

          {/* 5. What's Included */}
          <InstallInclusions />

          {/* 6. Rebates & Incentives */}
          {option.rebates > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Rebates & Incentives</h3>
              <div className="bg-yellow-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-700 text-lg">$</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{formatCurrency(option.rebates)} Utility Rebate</p>
                  <p className="text-sm text-gray-600">Applied automatically at checkout — no paperwork required.</p>
                </div>
              </div>
            </section>
          )}

          {/* 7. Financing Options */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Financing Options</h3>
            <div className="space-y-3">
              {financingPlans.map(plan => (
                <div key={plan.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{plan.name}</p>
                      {plan.tag && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{plan.tag}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>
                  <p className="text-lg font-bold text-blue-700">
                    {formatMonthly(calculateMonthlyPayment(option.totalPrice, plan.apr, plan.months))}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 8. Add-Ons Available */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Popular Add-Ons</h3>
            <div className="space-y-3">
              {popularAddons.map(addon => (
                <div key={addon.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{addon.name}</p>
                    <p className="text-sm text-gray-500">{addon.description}</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">+{formatCurrency(addon.price)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl px-6 py-3 font-semibold transition-colors">
            Close
          </button>
          <button onClick={() => onSelect?.(option)}
            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 py-3 font-semibold transition-colors">
            Select This System
          </button>
        </div>
      </div>
    </div>
  );
}
