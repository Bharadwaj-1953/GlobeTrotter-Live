export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Search hero */}
      <div className="skeleton h-48 w-full" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter sidebar */}
          <div className="lg:col-span-1">
            <div className="skeleton h-96 rounded-2xl" />
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 flex overflow-hidden h-40">
                <div className="skeleton w-48 flex-shrink-0" />
                <div className="flex-1 p-5 space-y-3">
                  <div className="skeleton h-5 w-48 rounded" />
                  <div className="skeleton h-3 w-32 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-8 w-24 rounded-lg mt-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
