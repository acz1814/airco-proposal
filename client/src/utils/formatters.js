export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatMonthly(amount) {
  return `${formatCurrency(amount)}/mo`;
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export function formatRelativeTime(isoString) {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function getStatusMeta(status) {
  const map = {
    draft:              { label: 'Draft',      bg: 'bg-gray-100',   text: 'text-gray-600'  },
    generated:          { label: 'Generated',  bg: 'bg-gray-100',   text: 'text-gray-600'  },
    sent:               { label: 'Sent',       bg: 'bg-blue-100',   text: 'text-blue-700'  },
    opened:             { label: 'Opened',     bg: 'bg-yellow-100', text: 'text-yellow-700'},
    explored:           { label: 'Exploring',  bg: 'bg-yellow-100', text: 'text-yellow-700'},
    option_selected:    { label: 'Interested', bg: 'bg-purple-100', text: 'text-purple-700'},
    financing_started:  { label: 'Financing',  bg: 'bg-indigo-100', text: 'text-indigo-700'},
    accepted:           { label: 'Accepted',   bg: 'bg-green-100',  text: 'text-green-700' },
    declined:           { label: 'Declined',   bg: 'bg-red-100',    text: 'text-red-600'   },
    expired:            { label: 'Expired',    bg: 'bg-gray-100',   text: 'text-gray-500'  },
  };
  return map[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-600' };
}

export function generateEstimateId() {
  return 'est-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function buildProposalUrl(estimateId) {
  const base = import.meta.env.VITE_APP_URL || window.location.origin;
  return `${base}/proposal/${estimateId}`;
}

export async function fireTrigger(estimateId, triggerName, payload = {}) {
  try {
    await fetch('/api/ghl/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estimateId, triggerName, ...payload })
    });
  } catch (err) {
    console.warn(`GHL trigger failed: ${triggerName}`, err);
  }
}
