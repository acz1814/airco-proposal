import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import { matchOptions } from '../utils/matchingEngine';
import { fireTrigger } from '../utils/formatters';

export default function Terms() {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [initials, setInitials] = useState('');
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const signatureRef = useRef(null);

  const optionId = searchParams.get('option');

  useEffect(() => {
    fetch(`/api/estimates/${estimateId}`)
      .then(r => r.json())
      .then(data => {
        if (data.estimate) {
          setEstimate(data.estimate);
          if (optionId) {
            const matched = matchOptions(
              data.estimate.jobDetails.tonnage,
              data.estimate.jobDetails.systemType,
              data.estimate.jobDetails.fuelType
            );
            const found = matched.find(o => o.id === optionId);
            if (found) setSelectedSystem(found);
          }
        }
      });
  }, [estimateId, optionId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await fireTrigger(estimateId, 'estimate_accepted');
    await fetch(`/api/estimates/${estimateId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' })
    });
    // Send notification email to homeowner
    if (estimate?.homeowner?.email) {
      const systemName = selectedSystem?.systemName || 'your new system';
      await fetch('/api/ghl/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimateId,
          type: 'email',
          recipient: estimate.homeowner.email,
          message: `Thank you for choosing AiRCO Mechanical! Your proposal for ${systemName} has been signed and accepted. Our scheduling team will contact you within 24 hours. Questions? Call 512-454-COOL (2665) or visit www.aircoaustin.com`
        })
      });
    }
    // Sync estimate to GHL
    await fetch('/api/ghl/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estimateId })
    });
    // Trigger estimate_accepted in GHL
    const homeownerName = `${estimate?.homeowner?.firstName || ''} ${estimate?.homeowner?.lastName || ''}`.trim();
    const homeownerEmail = estimate?.homeowner?.email || '';
    const signatureTimestamp = new Date().toISOString();
    await fetch('/api/ghl/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estimateId,
        triggerName: 'estimate_accepted',
        payload: {
          selectedOption: selectedSystem?.systemName || '',
          homeownerName,
          homeownerEmail,
          signatureTimestamp,
          signatureText: signature
        }
      })
    });
    // Record contract
    await fetch('/api/ghl/contract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estimateId,
        signatureText: signature,
        signatureTimestamp,
        homeownerName,
        homeownerEmail,
        selectedSystem: selectedSystem?.systemName || ''
      })
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-green-600 flex items-center justify-center">
        <div className="text-center text-white px-6 max-w-lg">
          <div className="mb-6">
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">You're All Set!</h1>
          {estimate && (
            <p className="text-xl mb-2">{estimate.homeowner.firstName} {estimate.homeowner.lastName}</p>
          )}
          {selectedSystem && (
            <p className="text-lg mb-6 opacity-90">{selectedSystem.systemName}</p>
          )}
          <p className="text-lg mb-2 opacity-90">
            Our scheduling team will contact you within 24 hours.
          </p>
          {estimate?.homeowner?.email && (
            <p className="text-lg mb-8 opacity-90">
              Your signed contract has been sent to {estimate.homeowner.email}
            </p>
          )}
          <div className="border-t border-green-400 pt-6 opacity-80">
            <p className="font-semibold text-lg">AiRCO Mechanical</p>
            <p className="text-sm">Phone: 512-454-COOL (2665)</p>
            <p className="text-sm">Email: info@aircoaustin.com</p>
            <p className="text-sm">www.aircoaustin.com</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <img src="/airco-logo.png" alt="AiRCO Mechanical" className="h-10 mx-auto"
            onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors mb-4"
          style={{ padding: '16px' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>

        <ProgressBar currentStep={3} />

        {/* Selected System Summary */}
        {selectedSystem && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-3">Selected System</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-gray-500">System</p>
                <p className="font-semibold text-gray-900">{selectedSystem.systemName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tier</p>
                <p className="font-semibold text-gray-900">{selectedSystem.tier}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">SEER2</p>
                <p className="font-semibold text-gray-900">{selectedSystem.efficiency}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tonnage</p>
                <p className="font-semibold text-gray-900">{selectedSystem.tonnage} Ton</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Warranty</p>
                <p className="font-semibold text-gray-900">{selectedSystem.warranty.parts} Parts / {selectedSystem.warranty.labor} Labor</p>
              </div>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: '#1e3a5f' }}>
          TERMS AND CONDITIONS
        </h1>
        <p className="text-center text-sm text-gray-600 mb-6">
          All service work is cash upon completion unless prior credit has been approved. Any account not paid when due will be charged the maximum interest allowed under state laws.
        </p>

        {/* Orange bordered box */}
        <div style={{ border: '2px solid #E8570C', padding: '16px', marginBottom: '16px' }} className="rounded-lg">
          <p className="text-sm text-gray-800 leading-relaxed mb-4">
            <strong>**Parts Warranty provided by manufacturer, not AiRCO.</strong><br /><br />
            <strong>***Any Labor Warranty period past 12 months from the day of installation completion requires a minimum of one annual preventative maintenance performed by AiRCO.</strong> The first annual maintenance visit must be performed within 24 months from the day of installation completion. Failure to meet this requirement will result in cancellation of your Labor Warranty by AiRCO. By signing this proposal you are accepting this responsibility and these exclusions. By initialing below you are confirming you have read this statement.
          </p>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Homeowner Initials</label>
            <input
              type="text"
              value={initials}
              onChange={e => {
                setInitials(e.target.value);
                if (e.target.value.length >= 2) {
                  signatureRef.current?.focus();
                }
              }}
              className="w-24 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              maxLength={5}
            />
          </div>
        </div>

        {/* Numbered terms */}
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed mb-8">
          <p>
            <strong>1.</strong> AiRCO shall not be liable for failure to perform this contract for any reason beyond their control. This agreement is subject to applicable laws, regulations, and codes.
          </p>
          <p>
            <strong>2.</strong> All material and equipment shall be new and of good quality unless otherwise stated. AiRCO shall not be liable for delays caused by strikes, fires, accidents, weather, carrier delays, or other causes beyond our control.
          </p>
          <p>
            <strong>3.</strong> The customer grants permission to AiRCO to perform the work described in this proposal and to make any necessary changes in the property to complete the installation, including but not limited to walls, ceilings, and floors as necessary.
          </p>

          <h3 className="text-base font-bold text-gray-900 mt-6 mb-2">1 YEAR SERVICE ALL LIMITED WARRANTY</h3>

          <p>
            <strong>4.</strong> AiRCO warrants that all work performed under this agreement will be free from defects in workmanship for a period of one (1) year from the date of installation completion. This warranty covers labor only and does not extend to any equipment or materials installed.
          </p>
          <p>
            <strong>5.</strong> This warranty does not cover damage caused by abuse, misuse, neglect, lack of maintenance, unauthorized modifications, acts of God, power surges, or any other cause not directly related to AiRCO's workmanship.
          </p>
          <p>
            <strong>6.</strong> AiRCO's sole obligation under this warranty shall be to repair or correct any defective workmanship at no additional charge to the customer during the warranty period.
          </p>
          <p>
            <strong>7.</strong> This warranty is non-transferable and applies only to the original purchaser at the original installation address.
          </p>
          <p>
            <strong>8.</strong> To obtain warranty service, the customer must contact AiRCO directly and provide reasonable access to the equipment during normal business hours.
          </p>

          <h3 className="text-base font-bold text-gray-900 mt-6 mb-2">LIMITATION OF LIABILITY</h3>

          <p>
            <strong>9.</strong> In no event shall AiRCO be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of use, loss of profits, or loss of data, however caused, whether in contract, tort, or under any other theory of liability, whether or not AiRCO has been advised of the possibility of such damages.
          </p>
          <p>
            <strong>10.</strong> AiRCO's total cumulative liability in connection with this agreement, whether in contract, tort, or otherwise, shall not exceed the total amount paid by the customer under this agreement.
          </p>
          <p>
            <strong>11.</strong> Any dispute arising out of or relating to this agreement shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, and judgment upon the award rendered by the arbitrator(s) may be entered in any court having jurisdiction thereof. The prevailing party shall be entitled to recover reasonable attorney's fees and costs.
          </p>
        </div>

        {/* Regulatory footer */}
        <div className="text-center text-xs text-gray-500 mb-6 leading-relaxed">
          <p>Regulated by The Texas Department of Licensing and Regulation | P.O. Box 12157 Austin, TX 78711 &bull; (800) 803-9202 &bull; (512) 463-6599</p>
          <p>AC LICENSE # TACLA51950C / PLUMBING LICENSE # M37961 / ELECTRICAL LICENSE # TECL35427</p>
        </div>

        <p className="text-center italic text-gray-500 text-sm mb-6">Comfort in Simplicity</p>

        <p className="text-xs text-gray-400 leading-relaxed mb-8">
          Equipment warranty is provided by the equipment manufacturer and is subject to the manufacturer's terms and conditions. AiRCO does not warrant any equipment beyond the manufacturer's warranty. Some equipment may contain refrigerants, oils, or other materials classified as hazardous. Customer acknowledges that AiRCO will handle and dispose of all hazardous materials in accordance with applicable federal, state, and local regulations. Customer agrees to provide AiRCO with any information necessary for the proper handling of such materials.
        </p>

        {/* Signature section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Type your full legal name to sign
          </label>
          <input
            ref={signatureRef}
            type="text"
            value={signature}
            onChange={e => setSignature(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none mb-3"
            placeholder="Full Legal Name"
          />
          <p className="text-xs text-gray-400 leading-relaxed">
            By typing your full name above, you are electronically signing this agreement. Your typed name constitutes your legal signature and indicates your acceptance of all terms and conditions above. This electronic signature is legally binding under the Texas Uniform Electronic Transactions Act (UETA) and the federal Electronic Signatures in Global and National Commerce Act (E-SIGN Act).
          </p>
        </div>

        <div className="text-center mb-12">
          <button
            disabled={!initials.trim() || !signature.trim() || submitting}
            onClick={handleSubmit}
            className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-10 py-3 font-semibold text-lg transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : 'Complete & Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
