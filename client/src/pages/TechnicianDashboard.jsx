import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function TechnicianDashboard() {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/estimates')
      .then(r => r.json())
      .then(data => { setEstimates(data.estimates || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stats = {
    total: estimates.length,
    accepted: estimates.filter(e => e.status === 'accepted').length,
    pending: estimates.filter(e => ['sent', 'opened', 'explored', 'option_selected', 'financing_started'].includes(e.status)).length,
    avgValue: estimates.filter(e => e.finalTotal).length > 0
      ? Math.round(estimates.filter(e => e.finalTotal).reduce((s, e) => s + e.finalTotal, 0) / estimates.filter(e => e.finalTotal).length)
      : 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Estimates This Month', value: stats.total, color: 'text-gray-900' },
            { label: 'Accepted', value: stats.accepted, color: 'text-green-600' },
            { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
            { label: 'Avg. Job Value', value: formatCurrency(stats.avgValue), color: 'text-blue-700' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Recent Estimates</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="px-6 py-3">Homeowner</th>
                    <th className="px-6 py-3">Address</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.map(est => (
                    <tr key={est.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {est.homeowner.firstName} {est.homeowner.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{est.homeowner.address}</td>
                      <td className="px-6 py-4"><StatusBadge status={est.status} /></td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {est.finalTotal ? formatCurrency(est.finalTotal) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(est.createdAt)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/tech/estimate/${est.id}`)}
                          className="text-blue-700 hover:text-blue-800 text-sm font-semibold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
