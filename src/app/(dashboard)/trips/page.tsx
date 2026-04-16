'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DESTINATIONS } from '@/lib/data/destinations'
import { formatCurrency, formatDateShort, getStatusColor, getRandomTripImage } from '@/lib/utils'
import { Plus, Plane, Calendar, User, Search, SlidersHorizontal, MapPin, CreditCard } from 'lucide-react'
import type { Trip } from '@/types'

const STATUS_FILTERS = ['all', 'active', 'draft', 'completed'] as const

export default function TripsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setTrips(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const filtered = trips.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter
    const name = (t.title + ' ' + (t.destination_name || '') + ' ' + (t.destination_country || '')).toLowerCase()
    const matchQuery = !query || name.includes(query.toLowerCase())
    return matchStatus && matchQuery
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Trips</h1>
            <p className="text-slate-500 text-sm mt-1">
              {trips.length} trip{trips.length !== 1 ? 's' : ''} planned
            </p>
          </div>
          <Link
            href="/search"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" />
            Plan New Trip
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search trips..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  filter === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Trip grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton h-64 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Plane className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-semibold text-lg mb-1">
              {query || filter !== 'all' ? 'No trips match your filters' : 'No trips yet'}
            </p>
            <p className="text-slate-400 text-sm mb-6">
              {query || filter !== 'all' ? 'Try clearing your search or filters' : 'Start planning your first adventure!'}
            </p>
            {(!query && filter === 'all') && (
              <Link href="/search"
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                Plan a Trip
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TripCard({ trip }: { trip: Trip }) {
  const router = useRouter()
  const dest = DESTINATIONS.find(d => d.id === trip.destination_id)
  const progress = trip.total_cost && trip.budget
    ? Math.min((trip.total_cost / trip.budget) * 100, 100)
    : trip.status === 'completed' ? 100 : trip.status === 'active' ? 60 : 20

  const imgUrl = trip.image_url || dest?.image_url || getRandomTripImage(trip.id)
  const destName = dest?.name || trip.destination_name || 'Destination'
  const destCountry = dest?.country || trip.destination_country || ''

  return (
    <div
      onClick={() => router.push(`/trips/${trip.id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative h-44">
        <img src={imgUrl} alt={trip.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(trip.status)}`}>
            {trip.status.toUpperCase()}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-sm truncate">{trip.title}</p>
          {(destName || destCountry) && (
            <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {destCountry ? `${destName}, ${destCountry}` : destName}
            </p>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {trip.start_date ? formatDateShort(trip.start_date) : 'Dates TBD'}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {trip.num_travelers} {trip.num_travelers === 1 ? 'person' : 'people'}
          </span>
          {trip.total_cost ? (
            <span className="ml-auto font-semibold text-blue-600">{formatCurrency(trip.total_cost)}</span>
          ) : null}
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Progress</span>
            <span className="text-slate-600 font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-50">
          <a
            href={`/payment?amount=${trip.total_cost || trip.budget || 0}&trip=${encodeURIComponent(trip.title)}&from=${encodeURIComponent((trip as any).from_city || '')}&to=${encodeURIComponent(destName)}&mode=flight&travelers=${trip.num_travelers}&tripId=${trip.id}`}
            onClick={e => e.stopPropagation()}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-blue-500/20">
            <CreditCard className="w-3.5 h-3.5" /> Pay Now
          </a>
        </div>
      </div>
    </div>
  )
}
