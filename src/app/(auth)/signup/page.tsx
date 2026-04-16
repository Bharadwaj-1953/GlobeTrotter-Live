'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Globe, Users, Map, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordStrength = () => {
    if (password.length === 0) return 0
    if (password.length < 6) return 1
    if (password.length < 10) return 2
    return 3
  }
  const strength = passwordStrength()
  const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500']
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong']

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email!</h2>
          <p className="text-slate-500 text-sm mb-6">
            We&apos;ve sent a confirmation link to <strong className="text-slate-700">{email}</strong>.
            Click it to activate your account and start your journey.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-100/50 overflow-hidden flex flex-col md:flex-row">

          {/* Left Panel */}
          <div className="md:w-[45%] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold text-xl tracking-tight">GlobeTrotter</span>
              </div>
              <h2 className="text-white text-3xl font-bold leading-tight mb-4">
                Your adventure starts here.
              </h2>
              <p className="text-blue-200 text-sm leading-relaxed">
                Join thousands of students planning smarter, cheaper, and more memorable trips.
              </p>
            </div>

            <div className="space-y-4 mt-10">
              {[
                { icon: <Users className="w-5 h-5" />, title: 'Group Voting', desc: 'Let your squad vote on the destination.' },
                { icon: <Map className="w-5 h-5" />, title: 'Budget Tracking', desc: 'Never go over budget again.' },
                { icon: <Globe className="w-5 h-5" />, title: 'All-in-One', desc: 'Flights, hotels, and events in one place.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0 text-white mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{item.title}</p>
                    <p className="text-blue-200 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-blue-300 text-xs mt-8 font-medium tracking-widest uppercase">
              The Social Nomad Experience
            </p>
          </div>

          {/* Right Panel */}
          <div className="flex-1 p-10 flex flex-col justify-center">
            <div className="max-w-sm mx-auto w-full">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Create an account</h1>
              <p className="text-slate-500 text-sm mb-8">Start your journey in under a minute.</p>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Rivera"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900
                               placeholder-slate-400 outline-none focus:bg-white focus:border-blue-400
                               focus:ring-3 focus:ring-blue-100 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nomad@university.edu"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900
                               placeholder-slate-400 outline-none focus:bg-white focus:border-blue-400
                               focus:ring-3 focus:ring-blue-100 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900
                                 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-400
                                 focus:ring-3 focus:ring-blue-100 transition-all text-sm pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              strength >= i ? strengthColors[strength] : 'bg-slate-100'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">{strengthLabels[strength]}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                             text-white font-semibold rounded-xl transition-all duration-200
                             flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    'Create Account 🚀'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
