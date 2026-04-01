import { getStatusMeta } from '../utils/formatters';

export default function StatusBadge({ status }) {
  const { label, bg, text } = getStatusMeta(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}
