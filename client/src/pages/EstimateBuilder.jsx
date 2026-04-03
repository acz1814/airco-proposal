import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';

export default function EstimateBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const DRAFT_KEY = 'airco_draft';

  const [form, setForm] = useState(() => {
    const defaults = {
      firstName: '', lastName: '', phone: '', email: '',
      address: '', city: '', state: 'TX', zip: '',
      tonnage: '3', systemType: 'split', fuelType: 'electric', notes: ''
    };
    if (!id) {
      try {
        const saved = sessionStorage.getItem(DRAFT_KEY);
        if (saved) return { ...defaults, ...JSON.parse(saved) };
      } catch {}
    }
    return defaults;
  });
  const [toast, setToast] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetch(`/api/estimates/${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.estimate) {
            const e = data.estimate;
            setForm({
              firstName: e.homeowner.firstName, lastName: e.homeowner.lastName,
              phone: e.homeowner.phone, email: e.homeowner.email,
              address: e.homeowner.address, city: e.homeowner.city,
              state: e.homeowner.state, zip: e.homeowner.zip,
              tonnage: String(e.jobDetails.tonnage), systemType: e.jobDetails.systemType,
              fuelType: e.jobDetails.fuelType, notes: e.jobDetails.notes || ''
            });
          }
        });
    }
  }, [id, isEdit]);

  const handleChange = (field, value) => setForm(prev => {
    const next = { ...prev, [field]: value };
    if (!isEdit) {
      try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next)); } catch {}
    }
    return next;
  });

  const handleGenerate = async () => {
    if (!form.firstName || !form.lastName || !form.phone || !form.email || !form.tonnage) {
      setToast({ type: 'error', message: 'Please fill in all required fields.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setGenerating(true);

    try {
      let eid = id;

      if (!eid) {
        const res = await fetch('/api/estimates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            homeowner: {
              firstName: form.firstName, lastName: form.lastName,
              phone: form.phone, email: form.email,
              address: form.address, city: form.city,
              state: form.state, zip: form.zip
            },
            jobDetails: {
              tonnage: parseFloat(form.tonnage), systemType: form.systemType,
              fuelType: form.fuelType, notes: form.notes
            }
          })
        });
        const data = await res.json();
        if (!data.estimate) throw new Error('Failed to create estimate');
        eid = data.estimate.id;
      }

      const params = new URLSearchParams();
      ['opt-good', 'opt-better', 'opt-best', 'opt-premium'].forEach(o => params.append('options', o));
      navigate(`/proposal/${eid}?${params.toString()}`);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to save estimate. Please try again.' });
      setTimeout(() => setToast(null), 3000);
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar showNewEstimate={false} />

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-medium
          ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <button onClick={() => navigate('/tech')} className="text-blue-700 hover:text-blue-800 text-sm font-medium mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">
          {isEdit ? 'Edit Estimate' : 'New Estimate'}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Input Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Homeowner Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" value={form.firstName} onChange={e => handleChange('firstName', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input type="text" value={form.lastName} onChange={e => handleChange('lastName', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" value={form.address} onChange={e => handleChange('address', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input type="text" value={form.city} onChange={e => handleChange('city', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input type="text" value={form.state} onChange={e => handleChange('state', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
                    <input type="text" value={form.zip} onChange={e => handleChange('zip', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Job Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tonnage *</label>
                  <select value={form.tonnage} onChange={e => handleChange('tonnage', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    {['1.5', '2', '2.5', '3', '3.5', '4', '5'].map(t => (
                      <option key={t} value={t}>{t} Ton</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">System Type</label>
                  <div className="flex gap-4">
                    {[['split', 'Central Split'], ['package', 'Package Unit'], ['heatpump', 'Heat Pump']].map(([v, l]) => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="systemType" value={v} checked={form.systemType === v}
                          onChange={e => handleChange('systemType', e.target.value)}
                          className="text-blue-700 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700">{l}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                  <div className="flex gap-4">
                    {[['electric', 'Electric'], ['gas', 'Gas']].map(([v, l]) => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="fuelType" value={v} checked={form.fuelType === v}
                          onChange={e => handleChange('fuelType', e.target.value)}
                          className="text-blue-700 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700">{l}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)}
                    rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" />
                </div>
              </div>
              <button onClick={handleGenerate} disabled={generating}
                className="mt-4 w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 font-semibold transition-colors">
                {generating ? 'Generating...' : 'Generate Options'}
              </button>
            </div>
          </div>

          {/* Right: Info Panel */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-gray-400 text-lg">Fill in the homeowner info and job details, then click Generate Options to see matching systems.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
