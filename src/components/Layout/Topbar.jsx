import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Topbar() {
  const { user } = useAuth()

  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 lg:px-6">
      <Link to="/dashboard/offered" className="flex items-center gap-2 lg:hidden">
        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
          eBay Dropshipping
        </span>
      </Link>
      <div className="text-xs text-slate-400">
        Signed in as{' '}
        <span className="font-medium text-slate-100">
          {user?.email ?? 'Guest'}
        </span>
      </div>
    </header>
  )
}

