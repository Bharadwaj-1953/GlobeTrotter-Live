'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, ChevronDown } from 'lucide-react'
import type { Profile } from '@/types'

interface Destination {
  id: string
  name: string
  country: string
  lat?: number
  lon?: number
}

interface Friend {
  id: string
  name: string
  avatar: string
  color: string
  isPreset?: boolean
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Preset friends
const PRESET_FRIENDS: Friend[] = [
  { id: 'am', name: 'Alex M.', avatar: 'AM', color: 'bg-blue-500', isPreset: true },
  { id: 'jk', name: 'Jordan K.', avatar: 'JK', color: 'bg-pink-500', isPreset: true },
  { id: 'sr', name: 'Sam R.', avatar: 'SR', color: 'bg-purple-500', isPreset: true },
  { id: 'tb', name: 'Taylor B.', avatar: 'TB', color: 'bg-green-500', isPreset: true },
  { id: 'ml', name: 'Morgan L.', avatar: 'ML', color: 'bg-orange-500', isPreset: true },
  { id: 'cw', name: 'Casey W.', avatar: 'CW', color: 'bg-red-500', isPreset: true },
]

export default function CreateGroupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tripName, setTripName] = useState('')
  const [startingCity, setStartingCity] = useState('')
  const [selectedDestinations, setSelectedDestinations] = useState<Destination[]>([])
  const [departureDate, setDepartureDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [transportModes, setTransportModes] = useState<string[]>(['flight'])
  const [budget, setBudget] = useState(400)
  const [invitedMembers, setInvitedMembers] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false)
  const [destinationSearch, setDestinationSearch] = useState('')
  const [destinationResults, setDestinationResults] = useState<Destination[]>([])
  const [searchingDestinations, setSearchingDestinations] = useState(false)
  const debouncedDestinationSearch = useDebounce(destinationSearch, 350)
  const [newFriendInput, setNewFriendInput] = useState('')
  const [creatingTrip, setCreatingTrip] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(prof || null)
      setLoading(false)
    }

    checkAuth()
  }, [supabase, router])

  // Fetch destination search results
  useEffect(() => {
    if (!debouncedDestinationSearch || debouncedDestinationSearch.trim().length < 2) {
      setDestinationResults([])
      return
    }

    const searchDestinations = async () => {
      setSearchingDestinations(true)
      try {
        const response = await fetch(`/api/search/destinations?q=${encodeURIComponent(debouncedDestinationSearch)}`)
        if (!response.ok) throw new Error('Search failed')
        const data = await response.json()
        setDestinationResults(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error searching destinations:', error)
        setDestinationResults([])
      } finally {
        setSearchingDestinations(false)
      }
    }

    searchDestinations()
  }, [debouncedDestinationSearch])

  const toggleTransportMode = (mode: string) => {
    setTransportModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    )
  }

  const removeDestination = (id: string) => {
    setSelectedDestinations(prev => prev.filter(d => d.id !== id))
  }

  const addDestination = (destination: Destination) => {
    if (selectedDestinations.length >= 6) {
      alert('Maximum 6 destinations allowed')
      return
    }
    if (!selectedDestinations.find(d => d.id === destination.id)) {
      setSelectedDestinations(prev => [...prev, {
        id: destination.id,
        name: destination.name,
        country: destination.country,
        lat: destination.lat,
        lon: destination.lon,
      }])
      setDestinationSearch('')
      setDestinationResults([])
    }
  }

  const toggleFriend = (friend: Friend) => {
    setInvitedMembers(prev => {
      const exists = prev.find(m => m.id === friend.id)
      if (exists) {
        return prev.filter(m => m.id !== friend.id)
      } else {
        return [...prev, friend]
      }
    })
  }

  const addCustomFriend = () => {
    if (!newFriendInput.trim()) return

    const newId = `custom-${Date.now()}`
    const initials = newFriendInput
      .trim()
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()

    const colors = ['bg-indigo-500', 'bg-cyan-500', 'bg-teal-500', 'bg-lime-500', 'bg-sky-500']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newFriend: Friend = {
      id: newId,
      name: newFriendInput.trim(),
      avatar: initials,
      color: randomColor,
    }

    setInvitedMembers(prev => [...prev, newFriend])
    setNewFriendInput('')
  }

  const removeFriend = (id: string) => {
    setInvitedMembers(prev => prev.filter(m => m.id !== id))
  }

  const handleCreateTrip = async () => {
    if (!tripName || !startingCity || selectedDestinations.length === 0 || !departureDate || !returnDate) {
      setCreateError('Please fill in all required fields')
      return
    }

    setCreatingTrip(true)
    setCreateError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Destinations stored as JSON in winning_destination_id while status = 'voting'
      const destPayload = JSON.stringify(selectedDestinations.map(d => ({
        id: d.id,
        name: d.name,
        country: d.country,
        lat: d.lat ?? null,
        lon: d.lon ?? null,
      })))

      // Create group trip
      const { data: groupTrip, error: groupError } = await supabase
        .from('group_trips')
        .insert({
          name: tripName,
          created_by: user.id,
          from_city: startingCity,
          winning_destination_id: destPayload,
          start_date: departureDate || null,
          end_date: returnDate || null,
          transport_modes: transportModes,
          status: 'voting',
          budget_per_person: budget,
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Add creator as organizer member
      const { error: memberErr } = await supabase.from('group_members').insert({
        group_trip_id: groupTrip.id,
        user_id: user.id,
        personal_budget: budget,
        role: 'organizer',
      })

      // Log member error but don't fail the whole operation
      if (memberErr) {
        console.warn('Warning: Could not insert user as group member (RLS):', memberErr)
      }

      // Redirect regardless of member insert success
      router.push(`/group/${groupTrip.id}/vote`)
    } catch (error) {
      console.error('Error creating group trip:', error)
      setCreateError('Failed to create trip. Please try again.')
    } finally {
      setCreatingTrip(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Group Plan</h1>
          <p className="text-gray-600">Start planning your next adventure with friends</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
          <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleCreateTrip() }}>
            {/* Trip Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Trip Name</label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g., Spring Break 2024"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {/* Starting City */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Starting City</label>
              <input
                type="text"
                value={startingCity}
                onChange={(e) => setStartingCity(e.target.value)}
                placeholder="e.g., Los Angeles"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {/* Destinations */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Destinations (up to 6)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedDestinations.map(dest => (
                  <div
                    key={dest.id}
                    className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
                  >
                    <span className="text-sm font-medium">{dest.name}, {dest.country}</span>
                    <button
                      type="button"
                      onClick={() => removeDestination(dest.id)}
                      className="hover:bg-blue-200 rounded p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Destination Search */}
              <div className="relative">
                <input
                  type="text"
                  value={destinationSearch}
                  onChange={(e) => setDestinationSearch(e.target.value)}
                  onFocus={() => setShowDestinationDropdown(true)}
                  placeholder="Search destinations..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  disabled={selectedDestinations.length >= 6}
                />

                {showDestinationDropdown && destinationSearch.trim().length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                    {searchingDestinations && (
                      <div className="px-4 py-3 text-center text-gray-600">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Searching...</span>
                      </div>
                    )}
                    {!searchingDestinations && destinationResults.length === 0 && (
                      <div className="px-4 py-3 text-center text-gray-600 text-sm">
                        No destinations found
                      </div>
                    )}
                    {!searchingDestinations && destinationResults.map(dest => (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => addDestination(dest)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        <p className="font-medium text-gray-900">{dest.name}</p>
                        <p className="text-xs text-gray-600">{dest.country}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Departure Date</label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Return Date</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Transport Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Preferred Transport Modes</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'flight', label: 'Air ✓', icon: '✈️' },
                  { id: 'car', label: 'Personal Car', icon: '🚗' },
                  { id: 'rental', label: 'Rental Car', icon: '🚙' },
                  { id: 'bus', label: 'Bus/Rail', icon: '🚌' },
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => toggleTransportMode(mode.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      transportModes.includes(mode.id)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{mode.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Slider */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Personal Budget: <span className="text-blue-600">${budget}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>$0</span>
                <span>$500</span>
                <span>$1000</span>
              </div>
            </div>

            {/* Invite Members */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Invite Group Members</label>
              
              {/* Preset Friends */}
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Preset friends:</p>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_FRIENDS.map(friend => (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => toggleFriend(friend)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        invitedMembers.find(m => m.id === friend.id)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 ${friend.color} rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-1`}>
                        {friend.avatar}
                      </div>
                      <p className="text-xs font-medium text-gray-900">{friend.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Members Chips */}
              {invitedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {invitedMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
                    >
                      <span className="text-sm font-medium">{member.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFriend(member.id)}
                        className="hover:bg-blue-200 rounded p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Custom Friend */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFriendInput}
                  onChange={(e) => setNewFriendInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomFriend()
                    }
                  }}
                  placeholder="Add email or name..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={addCustomFriend}
                  className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">{invitedMembers.length} members invited</p>
            </div>

            {/* Error Message */}
            {createError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{createError}</p>
              </div>
            )}

            {/* Create Button */}
            <button
              type="submit"
              disabled={creatingTrip}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 text-lg disabled:cursor-not-allowed"
            >
              {creatingTrip ? 'Creating trip...' : 'Create trip 🚀'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
