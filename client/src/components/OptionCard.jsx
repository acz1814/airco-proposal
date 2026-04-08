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

function parseWarrantyYears(str) {
  const m = str && str.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 1;
}

export default function OptionCard({ option, isSelected, onSelect, onLearnMore, onWarrantyChange }) {
  const partsYears = parseWarrantyYears(option.warranty.parts);
  const laborYears = parseWarrantyYears(option.warranty.labor);
  return (
    <div className={`relative bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-lg flex flex-col
      ${isSelected ? 'border-blue-700 shadow-lg' : tierColors[option.tier] || 'border-gray-200'}
      ${option.recommended ? 'ring-2 ring-blue-200' : ''}`}
    >
      {option.recommended && (
        <div className="absolute -top-3 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
          Recommended
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

      <div className="flex-grow flex flex-col">
        <ul className="space-y-2 mb-4 flex-grow">
          {option.keyBenefits.slice(0, 3).map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex justify-center text-sm text-gray-500">
          <div className="inline-grid gap-y-1 gap-x-1" style={{ gridTemplateColumns: 'auto auto auto auto auto' }}>
            <span className="font-medium text-gray-600">Warranty:</span>
            <span>Parts</span>
            <select
              value={partsYears}
              onChange={(e) => onWarrantyChange?.(option.id, 'parts', parseInt(e.target.value, 10))}
              onClick={(e) => e.stopPropagation()}
              className="border border-gray-200 rounded px-1.5 py-0.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>yr</span>
            <span></span>
            <span></span>
            <span>Labor</span>
            <select
              value={laborYears}
              onChange={(e) => onWarrantyChange?.(option.id, 'labor', parseInt(e.target.value, 10))}
              onClick={(e) => e.stopPropagation()}
              className="border border-gray-200 rounded px-1.5 py-0.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>yr</span>
            <span></span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={(e) => { e.stopPropagation(); onLearnMore?.(option); }}
          className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl px-6 py-2.5 font-semibold text-sm transition-colors"
        >
          Learn More
        </button>
        <label className="flex items-center justify-center gap-2 w-full py-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => { e.stopPropagation(); onSelect?.(option); }}
            className="w-4 h-4 text-blue-700 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-semibold text-gray-700">Compare</span>
        </label>
      </div>
    </div>
  );
}
