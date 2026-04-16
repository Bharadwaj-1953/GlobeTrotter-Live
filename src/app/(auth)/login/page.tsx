'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Globe, Users, Map, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/home')
      router.refresh()
    }
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
                Join the next generation of social nomads.
              </h2>
              <p className="text-blue-200 text-sm leading-relaxed">
                Plan, vote, and explore the world with your favorite people.
              </p>
            </div>

            <div className="space-y-4 mt-10">
              <FeatureItem
                icon={<Users className="w-5 h-5" />}
                title="Collaborative Planning"
                description="Vote on destinations and split costs easily."
              />
              <FeatureItem
                icon={<Map className="w-5 h-5" />}
                title="Social Itineraries"
                description="See where your friends are heading next."
              />
              <FeatureItem
                icon={<Globe className="w-5 h-5" />}
                title="Smart Recommendations"
                description="Curated trips tailored to your student budget."
              />
            </div>

            <p className="text-blue-300 text-xs mt-8 font-medium tracking-widest uppercase">
              The Social Nomad Experience
            </p>
          </div>

          {/* Right Panel */}
          <div className="flex-1 p-10 flex flex-col justify-center">
            <div className="max-w-sm mx-auto w-full">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome Back</h1>
              <p className="text-slate-500 text-sm mb-8">Sign in to continue your adventure.</p>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email or Username
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nomad@globetrotter.com"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900
                               placeholder-slate-400 outline-none focus:bg-white focus:border-blue-400
                               focus:ring-3 focus:ring-blue-100 transition-all text-sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <Link href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
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
                      Signing in…
                    </>
                  ) : (
                    'Log in'
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-xs text-slate-400 bg-white px-2">or</div>
              </div>

              <p className="text-center text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-blue-600 font-semibold hover:text-blue-700">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 GlobeTrotter · Redefining group travel for the modern digital nomad.
        </p>
      </div>
    </div>
  )
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0 text-white mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-white font-semibold text-sm">{title}</p>
        <p className="text-blue-200 text-xs mt-0.5">{description}</p>
      </div>
    </div>
  )
}
