'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import {
  Globe, Search, Bell, User, Plus, Users,
  LogOut, Settings, ChevronDown, Map,
} from 'lucide-react'
import type { Profile } from '@/types'

const NOTIFICATIONS = [
  { id: 1, text: 'Your upcoming trip is in 14 days!', time: '2h ago', unread: true },
  { id: 2, text: 'A group trip invitation is waiting for you.', time: '5h ago', unread: true },
  { id: 3, text: 'Flight prices dropped 12% — check new deals.', time: '1d ago', unread: false },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push('/search?q=' + encodeURIComponent(searchQuery.trim()))
    }
  }

  const navLinks = [
    { href: '/search', label: 'Plan Trip' },
    { href: '/group/create', label: 'Group Plan' },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav
      className={
        'sticky top-0 z-50 transition-all duration-300 ' +
        (scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100'
          : 'bg-white border-b border-slate-100')
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-blue-600 tracking-tight">GlobeTrotter</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors ' +
                  (isActive(link.href)
                    ? 'text-blue-600 bg-blue-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')
                }
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-sm hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl
                           text-slate-700 placeholder-slate-400 outline-none
                           focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100
                           transition-all duration-200"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search icon (mobile) */}
            <button
              onClick={() => router.push('/search')}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false) }}
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 z-50 overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <p className="font-bold text-slate-900 text-sm">Notifications</p>
                      <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">2 new</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {NOTIFICATIONS.map(n => (
                        <div
                          key={n.id}
                          className={'px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-default ' + (n.unread ? 'bg-blue-50/40' : '')}
                        >
                          <div className={'w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ' + (n.unread ? 'bg-blue-500' : 'bg-slate-200')} />
                          <div className="flex-1">
                            <p className="text-xs text-slate-700 leading-relaxed">{n.text}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2.5 border-t border-slate-100">
                      <button
                        onClick={() => setNotifOpen(false)}
                        className="w-full text-xs font-semibold text-blue-600 hover:text-blue-700 py-1"
                      >
                        Mark all as read
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* New Trip button */}
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700
                         text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Trip</span>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false) }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || ''}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    getInitials(profile?.full_name || profile?.username || 'User')
                  )}
                </div>
                <ChevronDown
                  className={'w-3.5 h-3.5 text-slate-400 transition-transform ' + (dropdownOpen ? 'rotate-180' : '')}
                />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 z-50 overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 text-sm">
                        {profile?.full_name || profile?.username || 'Traveler'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Level {profile?.level || 1} Nomad
                      </p>
                    </div>
                    <div className="py-1">
                      <DropdownItem href="/profile" icon={<User className="w-4 h-4" />} label="My Profile" onClick={() => setDropdownOpen(false)} />
                      <DropdownItem href="/trips" icon={<Map className="w-4 h-4" />} label="My Trips" onClick={() => setDropdownOpen(false)} />
                      <DropdownItem href="/group/create" icon={<Users className="w-4 h-4" />} label="Group Trips" onClick={() => setDropdownOpen(false)} />
                      <DropdownItem href="/search" icon={<Search className="w-4 h-4" />} label="Search" onClick={() => setDropdownOpen(false)} />
                    </div>
                    <div className="border-t border-slate-100 py-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

function DropdownItem({
  href, icon, label, onClick,
}: {
  href: string
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <span className="text-slate-400">{icon}</span>
      {label}
    </Link>
  )
}
