export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Cover */}
      <div className="skeleton h-52 w-full" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="relative -mt-16 mb-8 flex items-end gap-5">
          <div className="skeleton w-28 h-28 rounded-2xl border-4 border-white flex-shrink-0" />
          <div className="pb-2 space-y-2 flex-1">
            <div className="skeleton h-7 w-48 rounded-lg" />
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-3 w-64 rounded" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-52 rounded-2xl" />
          </div>
          <div className="lg:col-span-2">
            <div className="skeleton h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
