'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, MapPin, Calendar, Users, Plane, Train, Bus, Car,
  ArrowRight, Loader2, CheckCircle, TrendingUp, Clock, Zap
} from 'lucide-react'

interface DestResult {
  id: string
  name: string
  country: string
  countryCode: string
  displayName: string
  lat: number
  lon: number
}

interface TransportResult {
  id: string
  operator: string
  operatorLogo: string
  serviceNumber: string
  from: string
  to: string
  departureTime: string
  arrivalTime: string
  duration: string
  durationMins: number
  stops: number
  stopsLabel: string
  price: number
  totalPrice: number
  distanceKm: number
  class: string
  seatsLeft: number
  mode: TravelMode
}

type TravelMode = 'flight' | 'train' | 'bus' | 'car'

const POPULAR_DESTINATIONS = [
  { name: 'Tokyo',     country: 'Japan',     emoji: '🇯🇵', lat: 35.6762,  lon: 139.6503, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&w=400&q=80' },
  { name: 'Paris',     country: 'France',    emoji: '🇫🇷', lat: 48.8566,  lon: 2.3522,   image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&w=400&q=80' },
  { name: 'Bali',      country: 'Indonesia', emoji: '🇮🇩', lat: -8.3405,  lon: 115.0920, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&w=400&q=80' },
  { name: 'New York',  country: 'USA',       emoji: '🇺🇸', lat: 40.7128,  lon: -74.0060, image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&w=400&q=80' },
  { name: 'Barcelona', country: 'Spain',     emoji: '🇪🇸', lat: 41.3851,  lon: 2.1734,   image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&w=400&q=80' },
  { name: 'Dubai',     country: 'UAE',       emoji: '🇦🇪', lat: 25.2048,  lon: 55.2708,  image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&w=400&q=80' },
  { name: 'Rome',      country: 'Italy',     emoji: '🇮🇹', lat: 41.9028,  lon: 12.4964,  image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&w=400&q=80' },
  { name: 'Bangkok',   country: 'Thailand',  emoji: '🇹🇭', lat: 13.7563,  lon: 100.5018, image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&w=400&q=80' },
]

// Destination ID → city name map for home page links
const DEST_ID_MAP: Record<string, string> = {
  'dest-chicago': 'Chicago',
  'dest-paris': 'Paris',
  'dest-tokyo': 'Tokyo',
  'dest-bali': 'Bali',
  'dest-amalfi': 'Amalfi',
  'dest-sydney': 'Sydney',
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function generateTransportResults(
  fromCity: string,
  destName: string,
  distanceKm: number,
  travelers: number,
  mode: TravelMode
): TransportResult[] {
  const seed = destName.length + fromCity.length
  const rand = (min: number, max: number, offset = 0) =>
    Math.floor(min + ((seed * 13 + offset * 7) % (max - min)))

  if (mode === 'flight') return []

  const results: TransportResult[] = []

  if (mode === 'train') {
    if (distanceKm > 2000) return [] // trains not practical for very long distances
    const operators = [
      { name: 'Amtrak Express',  logo: '🚄', prefix: 'AE' },
      { name: 'Euro Rail',       logo: '🚅', prefix: 'ER' },
      { name: 'Shinkansen Ltd',  logo: '🚄', prefix: 'SH' },
    ]
    const count = Math.min(3, Math.max(1, Math.floor(3 - distanceKm / 800)))
    for (let i = 0; i < count; i++) {
      const op = operators[i % operators.length]
      const speedKmh = 200 + rand(0, 50, i)
      const durationMins = Math.round((distanceKm / speedKmh) * 60)
      const pricePerKm = 0.07 + rand(0, 4, i) * 0.01
      const price = Math.round(distanceKm * pricePerKm + 15)
      const depart = `${7 + rand(0, 10, i)}:${rand(0, 5, i) * 10 === 0 ? '00' : rand(0, 5, i) * 10}`
      const arrH = Math.floor((7 + rand(0, 10, i)) + durationMins / 60)
      const arrM = rand(0, 5, i) * 10
      results.push({
        id: `train-${i}`,
        operator: op.name,
        operatorLogo: op.logo,
        serviceNumber: `${op.prefix}${200 + rand(0, 500, i)}`,
        from: fromCity,
        to: destName,
        departureTime: depart,
        arrivalTime: `${arrH % 24}:${arrM === 0 ? '00' : arrM}`,
        duration: `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`,
        durationMins,
        stops: i === 0 ? 0 : 1,
        stopsLabel: i === 0 ? 'Direct' : '1 Stop',
        price,
        totalPrice: price * travelers,
        distanceKm,
        class: i === 0 ? 'First Class' : 'Economy',
        seatsLeft: rand(5, 40, i),
        mode: 'train',
      })
    }
  }

  if (mode === 'bus') {
    if (distanceKm > 1000) return []
    const operators = [
      { name: 'FlixBus',      logo: '🟢', prefix: 'FB' },
      { name: 'Greyhound',    logo: '🐶', prefix: 'GH' },
      { name: 'MegaBus',      logo: '🔵', prefix: 'MB' },
    ]
    const count = Math.min(4, Math.max(1, Math.floor(4 - distanceKm / 300)))
    for (let i = 0; i < count; i++) {
      const op = operators[i % operators.length]
      const speedKmh = 80 + rand(0, 20, i)
      const durationMins = Math.round((distanceKm / speedKmh) * 60)
      const pricePerKm = 0.04 + rand(0, 2, i) * 0.01
      const price = Math.round(distanceKm * pricePerKm + 8)
      const depart = `${6 + rand(0, 14, i)}:${rand(0, 5, i) * 10 === 0 ? '00' : rand(0, 5, i) * 10}`
      const arrH = Math.floor((6 + rand(0, 14, i)) + durationMins / 60)
      results.push({
        id: `bus-${i}`,
        operator: op.name,
        operatorLogo: op.logo,
        serviceNumber: `${op.prefix}${100 + rand(0, 200, i)}`,
        from: fromCity,
        to: destName,
        departureTime: depart,
        arrivalTime: `${arrH % 24}:${rand(0, 5, i) * 10 === 0 ? '00' : rand(0, 5, i) * 10}`,
        duration: `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`,
        durationMins,
        stops: i,
        stopsLabel: i === 0 ? 'Express' : `${i} Stop${i > 1 ? 's' : ''}`,
        price,
        totalPrice: price * travelers,
        distanceKm,
        class: i === 0 ? 'Premium' : 'Standard',
        seatsLeft: rand(2, 30, i),
        mode: 'bus',
      })
    }
  }

  if (mode === 'car') {
    const speedKmh = 100
    const durationMins = Math.round((distanceKm / speedKmh) * 60)
    const fuelCostPer100km = 12
    const fuelCost = Math.round((distanceKm / 100) * fuelCostPer100km)
    const rentalOptions = [
      { name: 'Self Drive',  logo: '🚗', price: fuelCost + 20,              class: 'Economy Car' },
      { name: 'Car Rental',  logo: '🚙', price: fuelCost + 45 + rand(0,20), class: 'Compact SUV' },
      { name: 'Luxury Ride', logo: '🏎️', price: fuelCost + 90 + rand(0,40), class: 'Premium Sedan' },
    ]
    rentalOptions.forEach((opt, i) => {
      results.push({
        id: `car-${i}`,
        operator: opt.name,
        operatorLogo: opt.logo,
        serviceNumber: `~${Math.round(distanceKm)} km drive`,
        from: fromCity,
        to: destName,
        departureTime: 'Flexible',
        arrivalTime: `${Math.floor(durationMins / 60)}h ${durationMins % 60}m later`,
        duration: `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`,
        durationMins,
        stops: 0,
        stopsLabel: 'No stops',
        price: opt.price,
        totalPrice: opt.price,
        distanceKm,
        class: opt.class,
        seatsLeft: 99,
        mode: 'car',
      })
    })
  }

  return results.sort((a, b) => a.totalPrice - b.totalPrice)
}

const MODE_CONFIG: Record<TravelMode, { label: string; icon: React.ReactNode; color: string; bgActive: string }> = {
  flight: { label: 'Flight',  icon: <Plane  className="w-4 h-4" />, color: 'text-blue-600',   bgActive: 'bg-blue-600 text-white' },
  train:  { label: 'Train',   icon: <Train  className="w-4 h-4" />, color: 'text-purple-600', bgActive: 'bg-purple-600 text-white' },
  bus:    { label: 'Bus',     icon: <Bus    className="w-4 h-4" />, color: 'text-green-600',  bgActive: 'bg-green-600 text-white' },
  car:    { label: 'Car',     icon: <Car    className="w-4 h-4" />, color: 'text-orange-600', bgActive: 'bg-orange-600 text-white' },
}

function SearchPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [fromCity, setFromCity] = useState('')
  const [toQuery, setToQuery] = useState('')
  const [selectedDest, setSelectedDest] = useState<DestResult | null>(null)
  const [departDate, setDepartDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [travelers, setTravelers] = useState(1)
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip')
  const [travelMode, setTravelMode] = useState<TravelMode>('flight')

  const [destSuggestions, setDestSuggestions] = useState<DestResult[]>([])
  const [loadingDests, setLoadingDests] = useState(false)
  const [showDestDrop, setShowDestDrop] = useState(false)
  const debouncedToQuery = useDebounce(toQuery, 350)

  const [results, setResults] = useState<TransportResult[]>([])
  const [loadingResults, setLoadingResults] = useState(false)
  const [searched, setSearched] = useState(false)
  const [distanceKm, setDistanceKm] = useState(0)

  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Pre-populate from query params (e.g. from navbar search or home page)
  useEffect(() => {
    const q = searchParams.get('q')
    const destId = searchParams.get('destination')
    const toParam = searchParams.get('to')

    if (q) {
      setToQuery(q)
    } else if (toParam) {
      setToQuery(toParam)
    } else if (destId) {
      const cityName = DEST_ID_MAP[destId] || destId.replace('dest-', '')
      setToQuery(cityName)
    }
  }, [])

  // Auto-fetch destination ONLY from query params on mount (ref prevents re-firing when user types)
  const autoPopulatedRef = useRef(false)
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('to') || searchParams.get('destination')
    if (!q || autoPopulatedRef.current) return
    autoPopulatedRef.current = true
    const cityName = q.startsWith('dest-') ? (DEST_ID_MAP[q] || q.replace('dest-', '')) : q
    fetch(`/api/search/destinations?q=${encodeURIComponent(cityName)}`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : []
        if (list.length > 0) {
          setSelectedDest(list[0])
          setToQuery(list[0].displayName)
        }
      })
      .catch(() => {})
  }, [])

  // Live destination autocomplete
  useEffect(() => {
    if (debouncedToQuery.length < 2) { setDestSuggestions([]); return }
    if (selectedDest && debouncedToQuery === selectedDest.displayName) return
    setLoadingDests(true)
    fetch(`/api/search/destinations?q=${encodeURIComponent(debouncedToQuery)}`)
      .then(r => r.json())
      .then(data => { setDestSuggestions(Array.isArray(data) ? data : []); setShowDestDrop(true) })
      .catch(() => setDestSuggestions([]))
      .finally(() => setLoadingDests(false))
  }, [debouncedToQuery])

  const selectDest = (dest: DestResult) => {
    setSelectedDest(dest)
    setToQuery(dest.displayName)
    setShowDestDrop(false)
    setDestSuggestions([])
  }

  const selectPopular = (dest: typeof POPULAR_DESTINATIONS[0]) => {
    const d: DestResult = {
      id: `popular-${dest.name}`,
      name: dest.name,
      country: dest.country,
      countryCode: '',
      displayName: `${dest.name}, ${dest.country}`,
      lat: dest.lat,
      lon: dest.lon,
    }
    setSelectedDest(d)
    setToQuery(d.displayName)
    setShowDestDrop(false)
  }

  const handleSearch = async () => {
    if (!selectedDest || !fromCity.trim()) return
    setLoadingResults(true)
    setSearched(true)
    setResults([])
    setSavedId(null)
    setSaveError('')

    try {
      const params = new URLSearchParams({
        from: fromCity,
        to: selectedDest.name,
        date: departDate,
        travelers: travelers.toString(),
        toLat: selectedDest.lat.toString(),
        toLon: selectedDest.lon.toString(),
      })
      const res = await fetch(`/api/search/flights?${params}`)
      const data = await res.json()
      const km = data.distanceKm || 0
      setDistanceKm(km)

      if (travelMode === 'flight') {
        setResults((data.flights || []).map((f: any) => ({ ...f, mode: 'flight' as TravelMode })))
      } else {
        const transport = generateTransportResults(fromCity, selectedDest.name, km, travelers, travelMode)
        setResults(transport)
      }
    } catch {
      setResults([])
    } finally {
      setLoadingResults(false)
    }
  }

  // Re-run search when mode changes (if already searched)
  useEffect(() => {
    if (searched && distanceKm > 0 && selectedDest && fromCity.trim()) {
      if (travelMode !== 'flight') {
        const transport = generateTransportResults(fromCity, selectedDest.name, distanceKm, travelers, travelMode)
        setResults(transport)
      }
    }
  }, [travelMode])

  const handleSave = async (result: TransportResult) => {
    setSavingId(result.id)
    setSaveError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const modeLabel = travelMode === 'flight' ? 'Flight' : travelMode === 'train' ? 'Train' : travelMode === 'bus' ? 'Bus' : 'Car'
      const title = `${fromCity} → ${selectedDest!.name}`
      const noteText = travelMode === 'flight'
        ? `Flight: ${result.operator} ${result.serviceNumber} · ${result.departureTime} → ${result.arrivalTime} · ${result.stopsLabel}`
        : `${modeLabel}: ${result.operator} ${result.serviceNumber} · ${result.duration} · ${result.class}`

      const { data, error } = await supabase.from('trips').insert({
        user_id: user.id,
        title,
        destination_name: selectedDest!.name,
        destination_country: selectedDest!.country,
        from_city: fromCity,
        start_date: departDate || null,
        end_date: returnDate || null,
        num_travelers: travelers,
        budget: result.totalPrice,
        total_cost: result.totalPrice,
        status: 'active',
        notes: noteText,
      }).select().single()

      if (error) { setSaveError('Save failed: ' + error.message); return }
      if (data) {
        setSavedId(result.id)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3500)
        setTimeout(() => router.push('/trips/' + data.id), 1500)
      }
    } catch (ex: any) {
      setSaveError(ex?.message || 'Something went wrong')
    } finally {
      setSavingId(null)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const modeUnavailable = searched && !loadingResults && results.length === 0 && distanceKm > 0

  const modeUnavailableMsg: Record<TravelMode, string> = {
    flight: 'No flights found for this route. Try different dates.',
    train: distanceKm > 2000 ? 'Train not available for distances over 2,000 km. Try Flight.' : 'No train routes found.',
    bus: distanceKm > 1000 ? 'Bus not available for distances over 1,000 km. Try Flight or Train.' : 'No bus routes found.',
    car: 'No car options available.',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          <div>
            <p className="font-bold text-sm">Trip Saved!</p>
            <p className="text-xs text-emerald-100">Opening your trip plan...</p>
          </div>
        </div>
      )}

      {/* Hero search section */}
      <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 pt-10 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1 text-center">Plan Your Trip</h1>
          <p className="text-blue-200 text-sm text-center mb-6">Flights, trains, buses, and more — any destination worldwide</p>

          {/* Travel Mode Tabs */}
          <div className="flex gap-2 mb-5 justify-center flex-wrap">
            {(Object.keys(MODE_CONFIG) as TravelMode[]).map(mode => (
              <button key={mode} onClick={() => setTravelMode(mode)}
                className={
                  'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ' +
                  (travelMode === mode ? MODE_CONFIG[mode].bgActive + ' shadow-lg' : 'bg-white/15 text-white hover:bg-white/25')
                }>
                {MODE_CONFIG[mode].icon}
                {MODE_CONFIG[mode].label}
              </button>
            ))}
          </div>

          {/* Trip type pills */}
          <div className="flex gap-2 mb-5 justify-center">
            {(['roundtrip', 'oneway'] as const).map(t => (
              <button key={t} onClick={() => setTripType(t)}
                className={
                  'px-4 py-1.5 rounded-full text-sm font-semibold transition-all ' +
                  (tripType === t ? 'bg-white text-blue-700' : 'bg-white/10 text-white/80 hover:bg-white/20')
                }>
                {t === 'roundtrip' ? 'Round Trip' : 'One Way'}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              {/* From */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">From</label>
                <div className="flex items-center gap-2 border-2 border-slate-200 focus-within:border-blue-500 rounded-xl px-3 py-2.5 transition-colors overflow-hidden">
                  <Plane className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Departure city"
                    value={fromCity}
                    onChange={e => setFromCity(e.target.value)}
                    className="flex-1 min-w-0 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* To — real destination autocomplete */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">To</label>
                <div className="flex items-center gap-2 border-2 border-slate-200 focus-within:border-blue-500 rounded-xl px-3 py-2.5 transition-colors overflow-hidden">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Any destination..."
                    value={toQuery}
                    onChange={e => { setToQuery(e.target.value); setSelectedDest(null) }}
                    onFocus={() => destSuggestions.length > 0 && setShowDestDrop(true)}
                    className="flex-1 min-w-0 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                  />
                  {loadingDests && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin flex-shrink-0" />}
                  {selectedDest && !loadingDests && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                </div>
                {showDestDrop && destSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {destSuggestions.map(d => (
                      <button key={d.id} onClick={() => selectDest(d)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-50 last:border-0">
                        <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{d.name}</p>
                          <p className="text-xs text-slate-500">{d.country}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Depart */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Depart</label>
                <div className="flex items-center gap-2 border-2 border-slate-200 focus-within:border-blue-500 rounded-xl px-3 py-2.5 transition-colors">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input type="date" value={departDate} min={today}
                    onChange={e => setDepartDate(e.target.value)}
                    className="flex-1 text-sm font-medium text-slate-900 outline-none bg-transparent" />
                </div>
              </div>

              {/* Return or Travelers */}
              {tripType === 'roundtrip' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Return</label>
                  <div className="flex items-center gap-2 border-2 border-slate-200 focus-within:border-blue-500 rounded-xl px-3 py-2.5 transition-colors">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input type="date" value={returnDate} min={departDate || today}
                      onChange={e => setReturnDate(e.target.value)}
                      className="flex-1 text-sm font-medium text-slate-900 outline-none bg-transparent" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Travelers</label>
                  <div className="flex items-center gap-2 border-2 border-slate-200 focus-within:border-blue-500 rounded-xl px-3 py-2.5 transition-colors">
                    <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <select value={travelers} onChange={e => setTravelers(parseInt(e.target.value))}
                      className="flex-1 text-sm font-medium text-slate-900 outline-none bg-transparent">
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n===1?'Traveler':'Travelers'}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {tripType === 'roundtrip' && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Travelers</label>
                  <div className="flex items-center gap-2 border-2 border-slate-200 focus-within:border-blue-500 rounded-xl px-3 py-2.5 transition-colors">
                    <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <select value={travelers} onChange={e => setTravelers(parseInt(e.target.value))}
                      className="flex-1 text-sm font-medium text-slate-900 outline-none bg-transparent">
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n===1?'Traveler':'Travelers'}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleSearch}
                  disabled={!selectedDest || !fromCity.trim() || loadingResults}
                  className="mt-5 flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:shadow-none text-sm whitespace-nowrap">
                  {loadingResults
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Searching...</>
                    : <><Search className="w-4 h-4" />Search {MODE_CONFIG[travelMode].label}s</>
                  }
                </button>
              </div>
            )}
            {tripType === 'oneway' && (
              <button onClick={handleSearch}
                disabled={!selectedDest || !fromCity.trim() || loadingResults}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:shadow-none text-sm">
                {loadingResults
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Searching...</>
                  : <><Search className="w-4 h-4" />Search {MODE_CONFIG[travelMode].label}s</>
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results & Popular Destinations */}
      <div className="max-w-4xl mx-auto px-4 mt-8 pb-16">

        {/* Search Results */}
        {searched && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">
                  {loadingResults
                    ? 'Searching...'
                    : modeUnavailable
                    ? 'No results'
                    : `${results.length} ${MODE_CONFIG[travelMode].label.toLowerCase()}${results.length !== 1 ? 's' : ''} found`
                  }
                </h2>
                {distanceKm > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fromCity} to {selectedDest?.name} · {distanceKm.toLocaleString()} km
                  </p>
                )}
              </div>
              {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            </div>

            {loadingResults ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/3" />
                        <div className="h-3 bg-slate-100 rounded w-1/4" />
                      </div>
                      <div className="w-20 h-8 bg-slate-200 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : modeUnavailable ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                <div className="text-4xl mb-3">{travelMode === 'train' ? '🚄' : travelMode === 'bus' ? '🚌' : travelMode === 'car' ? '🚗' : '✈️'}</div>
                <p className="text-slate-600 font-semibold mb-1">{modeUnavailableMsg[travelMode]}</p>
                <p className="text-slate-400 text-sm">Try a different travel mode or adjust your route.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result, idx) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    idx={idx}
                    fromCity={fromCity}
                    destName={selectedDest?.name || ''}
                    travelers={travelers}
                    savingId={savingId}
                    savedId={savedId}
                    travelMode={travelMode}
                    onSave={() => handleSave(result)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Popular Destinations */}
        {!searched && (
          <div className="pb-4">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-lg">Popular Destinations</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {POPULAR_DESTINATIONS.map(dest => (
                <button key={dest.name} onClick={() => selectPopular(dest)}
                  className="group relative rounded-2xl overflow-hidden aspect-square shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5">
                  <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-bold text-sm">{dest.emoji} {dest.name}</p>
                    <p className="text-white/70 text-xs">{dest.country}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: '✈️', title: 'Book Early', desc: 'Flights are cheapest 6-8 weeks before departure.' },
                { icon: '🎓', title: 'Student Deals', desc: 'Use your .edu email for exclusive discounts.' },
                { icon: '👥', title: 'Group Savings', desc: 'Travel with 4+ friends and save up to 30%.' },
              ].map(tip => (
                <div key={tip.title} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="text-2xl mb-2">{tip.icon}</div>
                  <p className="font-bold text-slate-900 text-sm">{tip.title}</p>
                  <p className="text-slate-500 text-xs mt-1">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ResultCard({
  result, idx, fromCity, destName, travelers, savingId, savedId, travelMode, onSave
}: {
  result: TransportResult
  idx: number
  fromCity: string
  destName: string
  travelers: number
  savingId: string | null
  savedId: string | null
  travelMode: TravelMode
  onSave: () => void
}) {
  const isSaving = savingId === result.id
  const isSaved = savedId === result.id

  const modeIcon = travelMode === 'train' ? <Train className="w-4 h-4 text-purple-500" />
    : travelMode === 'bus' ? <Bus className="w-4 h-4 text-green-500" />
    : travelMode === 'car' ? <Car className="w-4 h-4 text-orange-500" />
    : <Plane className="w-3.5 h-3.5 text-slate-400" />

  return (
    <div className={
      'bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all ' +
      (idx === 0 ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-100')
    }>
      {idx === 0 && (
        <div className="px-5 pt-3 pb-0">
          <span className={
            'text-xs font-bold px-2 py-0.5 rounded-full ' +
            (travelMode === 'train' ? 'text-purple-600 bg-purple-50'
            : travelMode === 'bus' ? 'text-green-600 bg-green-50'
            : travelMode === 'car' ? 'text-orange-600 bg-orange-50'
            : 'text-blue-600 bg-blue-50')
          }>
            {travelMode === 'car' ? 'Most Affordable' : 'Best Value'}
          </span>
        </div>
      )}
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5 min-w-[140px]">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg">
              {result.operatorLogo}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{result.operator}</p>
              <p className="text-xs text-slate-400">{result.serviceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">{result.departureTime}</p>
              <p className="text-xs text-slate-500">{fromCity.slice(0, 3).toUpperCase()}</p>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <p className="text-xs text-slate-400">{result.duration}</p>
              <div className="w-full flex items-center gap-1 my-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <div className="flex-1 h-px bg-slate-300" />
                {modeIcon}
                <div className="flex-1 h-px bg-slate-300" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              </div>
              <p className={
                'text-xs font-semibold ' +
                (result.stops === 0 ? 'text-emerald-600' : 'text-amber-600')
              }>
                {result.stopsLabel}
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">{result.arrivalTime}</p>
              <p className="text-xs text-slate-500">{destName.slice(0, 3).toUpperCase()}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">${result.totalPrice.toLocaleString()}</p>
              <p className="text-xs text-slate-400">total · {travelers} pax</p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={`/payment?amount=${result.totalPrice}&trip=${encodeURIComponent(fromCity + ' to ' + destName)}&from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(destName)}&mode=${travelMode}&travelers=${travelers}&operator=${encodeURIComponent(result.operator)}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 transition-all">
                Book Now <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <button onClick={onSave} disabled={isSaving || isSaved}
                className={
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 border ' +
                  (isSaved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700')
                }>
                {isSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</>
                  : isSaved ? <><CheckCircle className="w-3.5 h-3.5" />Saved</>
                  : <>Save to Plan</>}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{result.duration}</span>
          <span>{result.class}</span>
          {travelMode !== 'car' && result.seatsLeft < 20 && (
            <span className="text-amber-600 font-semibold">{result.seatsLeft} seats left</span>
          )}
          <span>${result.price}/person</span>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  )
}
