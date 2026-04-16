'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DESTINATIONS } from '@/lib/data/destinations'
import { formatCurrency } from '@/lib/utils'
import {
  Share2, Camera, MapPin, Calendar,
  Plane, TrendingUp, Globe, Edit2,
  Users, Heart, Plus
} from 'lucide-react'
import type { Trip, Profile } from '@/types'

const BADGES = [
  { icon: 'plane', label: 'Jet Setter', desc: 'Take your first flight', earned: true },
  { icon: 'globe', label: 'Asia Explorer', desc: 'Visit 3 Asian countries', earned: true },
  { icon: 'utensils', label: 'Foodie', desc: 'Eat local in 5 cities', earned: true },
  { icon: 'mountain', label: 'Adventurer', desc: 'Book an adventure activity', earned: false },
  { icon: 'waves', label: 'Beach Lover', desc: 'Visit 3 beach destinations', earned: false },
  { icon: 'camera', label: 'Photographer', desc: 'Share 10 trip photos', earned: false },
]

const BADGE_EMOJIS: Record<string, string> = {
  plane: String.fromCodePoint(0x2708, 0xFE0F),
  globe: String.fromCodePoint(0x1F30F),
  utensils: String.fromCodePoint(0x1F35C),
  mountain: String.fromCodePoint(0x1F3D4, 0xFE0F),
  waves: String.fromCodePoint(0x1F30A),
  camera: String.fromCodePoint(0x1F4F8),
}

const SAVED_DESTINATIONS = [
  { id: 'dest-sydney', name: 'Sydney', country: 'Australia', avg_cost_per_day: 190 },
  { id: 'dest-paris', name: 'Paris', country: 'France', avg_cost_per_day: 180 },
]

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-amber-100 text-amber-700',
  completed: 'bg-slate-100 text-slate-600',
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [groupCount, setGroupCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'trips' | 'badges' | 'saved'>('trips')
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      const { data: userTrips } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setTrips(userTrips || [])

      const { count } = await supabase
        .from('group_members')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setGroupCount(count || 0)

      setLoading(false)
    }
    init()
  }, [])

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const displayName = profile?.full_name || profile?.username || 'Traveler'
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const tripCount = trips.length
  const completedTrips = trips.filter(t => t.status === 'completed')
  const activeTrips = trips.filter(t => t.status === 'active')
  const totalSpend = trips.reduce((s, t) => s + (t.total_cost || 0), 0)
  const uniqueCountries = new Set(
    trips.map(t => {
      const dest = DESTINATIONS.find(d => d.id === t.destination_id)
      return dest?.country || t.destination_country || null
    }).filter(Boolean)
  ).size

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      {/* Cover */}
      <div className="relative">
        <div
          className="h-52 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&w=1400&q=80)',
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-indigo-900/20 to-transparent" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-xl text-white text-xs font-semibold hover:bg-white/30 transition-colors"
            >
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4">
          <div className="relative -mt-12 flex items-end gap-4 pb-4">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-xl">
                {initials}
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                {profile?.level || 1}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white border-2 border-white hover:bg-blue-700 transition-colors">
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div className="mb-1 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                  {profile?.username && (
                    <p className="text-sm text-slate-500">@{profile.username}</p>
                  )}
                </div>
                <Link
                  href="/home"
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />Edit
                </Link>
              </div>
              {profile?.bio && (
                <p className="text-sm text-slate-600 mt-1">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { icon: Globe, label: 'Countries', value: uniqueCountries || profile?.countries_visited || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Plane, label: 'Trips', value: tripCount, color: 'text-purple-600', bg: 'bg-purple-50' },
            { icon: MapPin, label: 'Completed', value: completedTrips.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: Users, label: 'Groups', value: groupCount, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
                <div className={['w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2', stat.bg].join(' ')}>
                  <Icon className={['w-5 h-5', stat.color].join(' ')} />
                </div>
                <p className={['text-2xl font-bold', stat.color].join(' ')}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Total spend */}
        {totalSpend > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 mb-6 text-white flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide mb-1">Total Travel Spend</p>
              <p className="text-3xl font-bold">{formatCurrency(totalSpend)}</p>
              <p className="text-blue-200 text-sm mt-0.5">across {tripCount} trip{tripCount !== 1 ? 's' : ''}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-300 opacity-60" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-slate-100 p-1.5 mb-6 shadow-sm">
          {(['trips', 'badges', 'saved'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all',
                activeTab === tab ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* My Trips */}
        {activeTab === 'trips' && (
          <div>
            {trips.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                <Plane className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">No trips yet</h3>
                <p className="text-slate-500 text-sm mb-6">Start planning your first adventure!</p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />Plan a Trip
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTrips.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Upcoming</h3>
                    {activeTrips.map(trip => {
                      const dest = DESTINATIONS.find(d => d.id === trip.destination_id)
                      const imgUrl = trip.image_url || dest?.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&w=800&q=80'
                      return (
                        <Link key={trip.id} href={'/trips/' + trip.id}
                          className="block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="relative h-36 overflow-hidden">
                            <img src={imgUrl} alt={trip.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute top-3 right-3">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-600 text-white">
                                Next Adventure
                              </span>
                            </div>
                            <div className="absolute bottom-3 left-4">
                              <h4 className="font-bold text-white text-xl">{trip.title}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                {trip.start_date && (
                                  <span className="text-white/80 text-xs flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                )}
                                {trip.total_cost && (
                                  <span className="text-white/80 text-xs">{formatCurrency(trip.total_cost)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}

                {trips.filter(t => t.status !== 'active').length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">All Trips</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {trips.filter(t => t.status !== 'active').map(trip => {
                        const dest = DESTINATIONS.find(d => d.id === trip.destination_id)
                        const imgUrl = trip.image_url || dest?.image_url || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&w=800&q=80'
                        return (
                          <Link key={trip.id} href={'/trips/' + trip.id}
                            className="block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="relative h-32 overflow-hidden">
                              <img src={imgUrl} alt={trip.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                              <div className="absolute bottom-2 left-3">
                                <h4 className="font-bold text-white text-sm">{trip.title}</h4>
                                <p className="text-white/70 text-xs">{dest?.name || 'Trip'}</p>
                              </div>
                            </div>
                            <div className="p-3 flex items-center justify-between">
                              <div>
                                {trip.start_date && (
                                  <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                  </p>
                                )}
                                {trip.total_cost && (
                                  <p className="text-xs font-bold text-slate-900 mt-0.5">{formatCurrency(trip.total_cost)}</p>
                                )}
                              </div>
                              <span className={['text-xs font-bold px-2 py-1 rounded-full capitalize', STATUS_STYLES[trip.status] || STATUS_STYLES.draft].join(' ')}>
                                {trip.status}
                              </span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Badges */}
        {activeTab === 'badges' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {BADGES.map(badge => (
              <div
                key={badge.label}
                className={[
                  'bg-white rounded-2xl border p-5 text-center shadow-sm transition-all',
                  badge.earned ? 'border-blue-200 shadow-blue-50' : 'border-slate-100 opacity-50',
                ].join(' ')}
              >
                <div className="text-4xl mb-3">{BADGE_EMOJIS[badge.icon]}</div>
                <p className="font-bold text-slate-900 text-sm">{badge.label}</p>
                <p className="text-xs text-slate-500 mt-1">{badge.desc}</p>
                {badge.earned ? (
                  <span className="inline-block mt-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Earned</span>
                ) : (
                  <span className="inline-block mt-2 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Locked</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Saved / Bucket List */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Popular destinations to add to your bucket list:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DESTINATIONS.slice(0, 6).map(dest => (
                <div key={dest.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <img src={dest.image_url} alt={dest.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{dest.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{dest.country}
                    </p>
                    <p className="text-xs font-semibold text-blue-600 mt-1">
                      {formatCurrency(dest.avg_cost_per_day)}/day avg
                    </p>
                  </div>
                  <Link
                    href="/search"
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex-shrink-0"
                  >
                    Plan
                  </Link>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center">
              <Heart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium mb-1">Dream big, travel often</p>
              <p className="text-xs text-slate-400 mb-3">Search any destination worldwide and plan your next trip.</p>
              <Link href="/search"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors">
                <Plus className="w-3.5 h-3.5" />Search Destinations
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
