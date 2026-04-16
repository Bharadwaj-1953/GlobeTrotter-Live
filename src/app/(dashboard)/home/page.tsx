'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DESTINATIONS } from '@/lib/data/destinations'
import { formatCurrency, formatDateShort, getStatusColor, getRandomTripImage } from '@/lib/utils'
import {
  Plus, Users, ChevronRight, Zap, ArrowRight,
  MapPin, Calendar, User, Plane, Star, TrendingUp
} from 'lucide-react'
import type { Trip, GroupTrip, Profile } from '@/types'

const FLASH_DEALS = [
  {
    id: 1,
    label: 'FLASH DEALS',
    title: 'Iceland Roadtrip Package',
    desc: 'Exclusive group discount for students this winter.',
    color: 'from-teal-600 to-cyan-500',
    discount: '30% OFF',
  },
  {
    id: 2,
    label: 'STUDENT DEAL',
    title: 'Tokyo Explorer Bundle',
    desc: 'Flight + 5 nights hotel for students only.',
    color: 'from-blue-600 to-indigo-600',
    discount: '25% OFF',
  },
  {
    id: 3,
    label: 'LIMITED TIME',
    title: 'Bali Group Special',
    desc: 'Book for 4+ friends and save big.',
    color: 'from-orange-500 to-amber-500',
    discount: '20% OFF',
  },
]


export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [groups, setGroups] = useState<{id: string; name: string; status: string; member_count?: number}[]>([])
  const [dealIndex, setDealIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      const { data: userTrips } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(4)
      setTrips(userTrips || [])

      // Load real group trips
      const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_trip_id, group_trips(id, name, status)')
        .eq('user_id', user.id)
        .limit(4)
      if (userGroups && userGroups.length > 0) {
        const grps = userGroups
          .map((g: any) => g.group_trips)
          .filter(Boolean)
          .map((g: any) => ({ id: g.id, name: g.name, status: g.status }))
        setGroups(grps)
      }

      setLoading(false)
    }
    init()
  }, [])

  // Cycle flash deals
  useEffect(() => {
    const timer = setInterval(() => setDealIndex((i) => (i + 1) % FLASH_DEALS.length), 5000)
    return () => clearInterval(timer)
  }, [])

  const deal = FLASH_DEALS[dealIndex]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[440px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&w=1400&q=80"
          alt="Paris"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute inset-0 flex flex-col justify-end pb-10 px-6 md:px-12 max-w-7xl mx-auto w-full left-0 right-0">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-2">
            Plan Smart.
            <br />
            <span className="text-cyan-400">Travel Better.</span>
          </h1>
          <p className="text-white/80 text-sm mb-6 max-w-md">
            {profile ? `Welcome back, ${profile.full_name?.split(' ')[0] || 'Nomad'}! Where to next?` : 'Your student travel companion — flights, hotels, and group trips in one place.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/search"
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white
                         font-semibold rounded-2xl transition-all shadow-lg shadow-blue-900/30 text-sm"
            >
              <Plus className="w-4 h-4" />
              Plan a Trip
            </Link>
            <Link
              href="/group/create"
              className="flex items-center gap-2 px-5 py-3 bg-white/15 hover:bg-white/25 text-white
                         font-semibold rounded-2xl transition-all backdrop-blur-sm border border-white/25 text-sm"
            >
              <Users className="w-4 h-4" />
              Plan a Group Trip
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* My Plans */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">My Plans</h2>
              <Link href="/trips" className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton h-48 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trips.slice(0, 4).map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
                {trips.length === 0 && (
                  <div className="sm:col-span-2 flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                    <Plane className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-slate-500 text-sm font-medium">No trips yet</p>
                    <p className="text-slate-400 text-xs mb-4">Start planning your first adventure!</p>
                    <Link href="/search" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors">
                      Plan a Trip
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Explore Destinations */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Explore Destinations</h2>
                <Link href="/search" className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                  All Destinations <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DESTINATIONS.slice(0, 3).map((dest) => (
                  <Link
                    key={dest.id}
                    href={`/search?to=${encodeURIComponent(dest.name)}`}
                    className="group relative rounded-2xl overflow-hidden h-32 card-hover"
                  >
                    <img src={dest.image_url} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 hero-overlay" />
                    <div className="absolute bottom-2 left-3">
                      <p className="text-white font-bold text-sm">{dest.name}</p>
                      <p className="text-white/80 text-xs">{dest.country}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Group Trips */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Group Trips</h2>
              <div className="space-y-3">
                {groups.length > 0 ? groups.map((group, i) => {
                  const colors = ['bg-orange-400', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500']
                  const color = colors[i % colors.length]
                  const avatar = group.name.slice(0, 2).toUpperCase()
                  return (
                    <Link
                      key={group.id}
                      href={`/group/${group.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{group.name}</p>
                        <p className="text-xs text-slate-500">{group.status === 'voting' ? 'Voting Phase' : group.status === 'planning' ? 'Planning' : 'Booked'}</p>
                      </div>
                      {group.status === 'voting' ? (
                        <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        </div>
                      )}
                    </Link>
                  )
                }) : (
                  <Link href="/group/create" className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                    <div className="w-10 h-10 bg-slate-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                      <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600 group-hover:text-blue-700">Create a Group Trip</p>
                      <p className="text-xs text-slate-400">Plan & vote with friends</p>
                    </div>
                  </Link>
                )}
              </div>
              <Link
                href="/group/create"
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed
                           border-blue-200 text-blue-600 text-sm font-medium rounded-xl hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Group Invite
              </Link>
            </div>

            {/* Flash Deal */}
            <div className={`bg-gradient-to-br ${deal.color} rounded-2xl p-5 text-white relative overflow-hidden`}>
              <div className="absolute top-3 right-3 bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                {deal.discount}
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-xs font-bold tracking-wider">{deal.label}</span>
              </div>
              <h3 className="font-bold text-lg leading-tight mb-1">{deal.title}</h3>
              <p className="text-white/80 text-xs mb-4">{deal.desc}</p>
              <button onClick={() => router.push('/search')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold
                                 rounded-xl transition-colors border border-white/30">
                Search Flights →
              </button>
              {/* Deal indicator dots */}
              <div className="flex gap-1 mt-3">
                {FLASH_DEALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setDealIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${i === dealIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
                  />
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Your Travel Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Countries" value={profile?.countries_visited ?? 0} color="bg-blue-50 text-blue-700" />
                <StatBox label="Cities" value={profile?.cities_visited ?? 0} color="bg-cyan-50 text-cyan-700" />
                <StatBox label="Trips" value={trips.length} color="bg-indigo-50 text-indigo-700" />
                <StatBox label="Miles" value={`${(profile?.miles_traveled ?? 0).toLocaleString()}`} color="bg-rose-50 text-rose-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TripCard({ trip }: { trip: Trip }) {
  const router = useRouter()
  const dest = DESTINATIONS.find((d) => d.id === trip.destination_id)
  const progress = trip.total_cost && trip.budget ? Math.min((trip.total_cost / trip.budget) * 100, 100) : 15

  return (
    <div
      onClick={() => router.push(`/trips/${trip.id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer card-hover"
    >
      <div className="relative h-36">
        <img
          src={trip.image_url || dest?.image_url || getRandomTripImage(trip.id)}
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(trip.status)}`}>
            {trip.status.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-900 text-sm mb-1">{trip.title}</h3>
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {trip.start_date ? `${formatDateShort(trip.start_date)} – ${formatDateShort(trip.end_date)}` : 'Dates TBD'}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {trip.num_travelers} People
          </span>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Planning progress</span>
            <span className="text-slate-600 font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`${color} rounded-xl p-3 text-center`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-70 mt-0.5">{label}</p>
    </div>
  )
}
