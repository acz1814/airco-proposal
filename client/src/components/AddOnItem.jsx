import { formatCurrency } from '../utils/formatters';

export default function AddOnItem({ addon, isSelected, onToggle }) {
  return (
    <div className={`bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-md
      ${isSelected ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">{addon.name}</h4>
            {addon.popular && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                Popular Choice
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{addon.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-gray-900">+{formatCurrency(addon.price)}</p>
          <p className="text-sm text-blue-600 font-medium">+{formatCurrency(addon.monthlyAddition)}/mo</p>
        </div>
      </div>
      <button
        onClick={() => onToggle?.(addon.id)}
        className={`mt-3 w-full rounded-xl px-4 py-2.5 font-semibold text-sm transition-colors
          ${isSelected
            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
            : 'bg-blue-700 text-white hover:bg-blue-800'}`}
      >
        {isSelected ? 'Remove' : 'Add'}
      </button>
    </div>
  );
}
