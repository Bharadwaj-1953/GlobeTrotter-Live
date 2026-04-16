import Link from 'next/link'
import { Globe } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base text-blue-600">GlobeTrotter</span>
            </div>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              Making collective travel seamless for the modern digital nomad. Plan smart, travel better.
            </p>
            <p className="text-xs text-slate-400 mt-4">© 2026 GlobeTrotter. The Social Nomad Experience.</p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2">
              {['About', 'Safety', 'Terms', 'Privacy'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Newsletter</h4>
            <p className="text-sm text-slate-500 mb-3">Get student travel deals in your inbox.</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg
                           placeholder-slate-400 outline-none focus:border-blue-300 focus:ring-2
                           focus:ring-blue-100 transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg
                           hover:bg-blue-700 transition-colors"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </div>
    </footer>
  )
}
