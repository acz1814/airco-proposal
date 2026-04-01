import { formatCurrency, formatMonthly } from '../utils/formatters';
import FinancingBadge from './FinancingBadge';

const tierColors = {
  Good: 'border-gray-300',
  Better: 'border-blue-400',
  Best: 'border-blue-600',
  Premium: 'border-indigo-600'
};

const tierBg = {
  Good: 'bg-gray-100 text-gray-700',
  Better: 'bg-blue-100 text-blue-700',
  Best: 'bg-blue-600 text-white',
  Premium: 'bg-indigo-600 text-white'
};

export default function OptionCard({ option, isSelected, onSelect, onLearnMore }) {
  return (
    <div className={`relative bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-lg cursor-pointer
      ${isSelected ? 'border-blue-700 shadow-lg' : tierColors[option.tier] || 'border-gray-200'}
      ${option.recommended ? 'ring-2 ring-blue-200' : ''}`}
    >
      {option.recommended && (
        <div className="absolute -top-3 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
          Recommended
        </div>
      )}

      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${tierBg[option.tier]}`}>
        {option.tier}
      </span>

      <h3 className="text-lg font-bold text-gray-900 mb-1">{option.systemName}</h3>
      <p className="text-sm text-gray-500 mb-1">{option.indoor}</p>
      <p className="text-sm text-gray-500 mb-3">{option.outdoor}</p>

      <div className="inline-block bg-green-50 text-green-700 text-sm font-semibold px-2.5 py-1 rounded-lg mb-4">
        {option.efficiency}
      </div>

      <ul className="space-y-2 mb-4">
        {option.keyBenefits.slice(0, 3).map((benefit, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {benefit}
          </li>
        ))}
      </ul>

      <p className="text-sm text-gray-500 mb-1">
        Warranty: {option.warranty.parts} Parts · {option.warranty.labor} Labor
      </p>

      {option.rebates > 0 && (
        <div className="bg-yellow-50 text-yellow-700 text-sm font-medium px-3 py-1.5 rounded-lg mb-3 inline-block">
          {formatCurrency(option.rebates)} Rebate Available
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">Total Investment</p>
        <p className="text-3xl font-bold text-gray-900">{formatCurrency(option.totalPrice)}</p>
        <FinancingBadge monthlyPayment={option.monthlyPayment} />
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={(e) => { e.stopPropagation(); onLearnMore?.(option); }}
          className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl px-6 py-2.5 font-semibold text-sm transition-colors"
        >
          Learn More
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect?.(option); }}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 py-3 font-semibold text-sm transition-colors"
        >
          Select This System
        </button>
      </div>
    </div>
  );
}
