const inclusions = [
  "Permits pulled and filed",
  "Old equipment removal and disposal",
  "New equipment startup and testing",
  "All code-required safety items",
  "Full site cleanup",
  "Walk-through and system tutorial"
];

export default function InstallInclusions() {
  return (
    <div className="bg-blue-50 rounded-2xl p-6 mt-8">
      <h3 className="text-lg font-bold text-gray-900 mb-4">What's Included With Every Installation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {inclusions.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
