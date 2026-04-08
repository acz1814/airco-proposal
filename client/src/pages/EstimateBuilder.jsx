import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import * as estimateStorage from '../utils/estimateStorage';

export default function EstimateBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const DRAFT_KEY = 'draft';
  const PHOTOS_KEY = 'photos';

  // Track which estimate id our scoped storage uses. For new drafts we create
  // a temporary id; once the estimate is saved we migrate to the real id.
  const [photoEstimateId, setPhotoEstimateId] = useState(() => id || `est-new-${Date.now()}`);
  useEffect(() => { estimateStorage.setActiveEstimate(photoEstimateId); }, [photoEstimateId]);

  const [form, setForm] = useState(() => {
    const defaults = {
      firstName: '', lastName: '', phone: '', email: '',
      address: '', city: '', state: 'TX', zip: '',
      tonnage: '3', systemType: 'split', fuelType: 'electric', notes: ''
    };
    if (!id) {
      const saved = estimateStorage.getJSON(DRAFT_KEY);
      if (saved) return { ...defaults, ...saved };
    }
    return defaults;
  });
  const [toast, setToast] = useState(null);
  const [generating, setGenerating] = useState(false);
  const PHOTO_SLOTS = 12;
  const [photos, setPhotos] = useState(() => {
    const saved = estimateStorage.getJSON(PHOTOS_KEY);
    if (Array.isArray(saved)) {
      const next = Array(PHOTO_SLOTS).fill(null);
      saved.slice(0, PHOTO_SLOTS).forEach((p, i) => { next[i] = p; });
      return next;
    }
    return Array(PHOTO_SLOTS).fill(null);
  });
  const fileInputRefs = useRef(Array(PHOTO_SLOTS).fill(null).map(() => ({ current: null }))).current;

  useEffect(() => {
    estimateStorage.setItem(PHOTOS_KEY, photos);
  }, [photos, photoEstimateId]);

  const handlePhotoSelect = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotos(prev => {
        const next = [...prev];
        next[index] = reader.result;
        return next;
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removePhoto = (index) => {
    setPhotos(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

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
    if (!isEdit) estimateStorage.setItem(DRAFT_KEY, next);
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
        // Migrate scoped state from temp id to the real estimate id
        estimateStorage.migrateEstimate(photoEstimateId, eid);
        estimateStorage.setActiveEstimate(eid);
        setPhotoEstimateId(eid);
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
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Job Site Photos (Optional)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, i) => (
                  <div key={i} className="relative">
                    <input
                      ref={el => { fileInputRefs[i].current = el; }}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={e => handlePhotoSelect(i, e)}
                    />
                    {photo ? (
                      <div
                        className="aspect-square rounded-xl border-2 border-blue-500 overflow-hidden relative cursor-pointer"
                        onClick={() => fileInputRefs[i].current?.click()}
                      >
                        <img src={photo} alt={`Site photo ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={e => { e.stopPropagation(); removePhoto(i); }}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-sm leading-none"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <div
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                        onClick={() => fileInputRefs[i].current?.click()}
                      >
                        <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <circle cx="12" cy="13" r="3" strokeWidth={1.5} />
                        </svg>
                        <span className="text-xs text-gray-400">Tap to add photo</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-gray-400 text-lg">Fill in the homeowner info and job details, then click Generate Options to see matching systems.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
