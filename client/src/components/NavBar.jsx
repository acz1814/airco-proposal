import { Link } from 'react-router-dom';

export default function NavBar({ showNewEstimate = true }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/tech" className="flex items-center gap-2">
          <img src="/airco-logo.png" alt="AiRCO Mechanical" className="h-10"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden items-center gap-1 text-xl font-bold" style={{ display: 'none' }}>
            <span className="text-blue-700">AiRCO</span>
            <span className="text-orange-500">Mechanical</span>
          </div>
        </Link>
        {showNewEstimate && (
          <Link
            to="/tech/estimate/new"
            className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 py-2.5 font-semibold text-sm transition-colors"
          >
            New Estimate
          </Link>
        )}
      </div>
    </nav>
  );
}
