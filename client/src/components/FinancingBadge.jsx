import { formatCurrency } from '../utils/formatters';

export default function FinancingBadge({ monthlyPayment }) {
  return (
    <div className="flex items-center gap-1 text-blue-700 text-sm font-semibold">
      <span>As low as {formatCurrency(monthlyPayment)}/mo</span>
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}
