import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import OptionCard from '../components/OptionCard';
import { matchOptions } from '../utils/matchingEngine';
import { buildProposalUrl, fireTrigger } from '../utils/formatters';

export default function EstimateBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    address: '', city: '', state: 'TX', zip: '',
    tonnage: '3', systemType: 'split', fuelType: 'electric', notes: ''
  });
  const [options, setOptions] = useState([]);
  const [estimateId, setEstimateId] = useState(id || null);
  const [toast, setToast] = useState(null);
  const [sending, setSending] = useState(false);

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
            setOptions(matchOptions(e.jobDetails.tonnage, e.jobDetails.systemType, e.jobDetails.fuelType));
          }
        });
    }
  }, [id, isEdit]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleGenerate = async () => {
    if (!form.firstName || !form.lastName || !form.phone || !form.email || !form.tonnage) {
      setToast({ type: 'error', message: 'Please fill in all required fields.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const matched = matchOptions(form.tonnage, form.systemType, form.fuelType);
    setOptions(matched);

    if (!estimateId) {
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
      if (data.estimate) setEstimateId(data.estimate.id);
    }
  };

  const handleSend = async () => {
    if (!estimateId) return;
    setSending(true);

    await fetch(`/api/estimates/${estimateId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent' })
    });

    await fireTrigger(estimateId, 'estimate_sent');

    await fetch('/api/ghl/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estimateId,
        type: 'email',
        recipient: form.email,
        message: `Hi ${form.firstName}, your HVAC estimate is ready: ${buildProposalUrl(estimateId)}`
      })
    });

    await fetch('/api/ghl/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estimateId,
        type: 'sms',
        recipient: form.phone,
        message: `Hi ${form.firstName}, your AiRCO estimate is ready! View it here: ${buildProposalUrl(estimateId)}`
      })
    });

    setSending(false);
    setToast({ type: 'success', message: `Estimate sent to ${form.firstName} via email and SMS` });
    setTimeout(() => setToast(null), 4000);
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
              <button onClick={handleGenerate}
                className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 py-3 font-semibold transition-colors">
                Generate Options
              </button>
            </div>
          </div>

          {/* Right: Generated Options */}
          <div>
            {options.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-gray-400 text-lg">Fill in job details and click Generate Options</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Generated Options</h2>
                {options.map(opt => (
                  <div key={opt.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-500 uppercase">{opt.tier}</span>
                      {opt.recommended && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Recommended</span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900">{opt.systemName}</h3>
                    <p className="text-sm text-gray-500">{opt.efficiency} · {opt.tonnage} Ton</p>
                  </div>
                ))}
                <button onClick={handleSend} disabled={sending || !estimateId}
                  className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 font-semibold transition-colors">
                  {sending ? 'Sending...' : 'Send to Homeowner'}
                </button>
                {estimateId && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Proposal link: {buildProposalUrl(estimateId)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
