export default function TripDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      <div className="skeleton h-80 w-full" />

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 h-12" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="skeleton h-5 w-32 rounded mb-5" />
                <div className="skeleton h-28 rounded-xl mb-4" />
                <div className="space-y-2">
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-4 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
