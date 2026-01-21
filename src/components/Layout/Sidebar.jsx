import { NavLink } from 'react-router-dom'
import Button from '../UI/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const navItems = [
  { to: '/dashboard/offered', label: 'Offered Products' },
  { to: '/dashboard/manual-search', label: 'Manual Search' },
  { to: '/dashboard/saved', label: 'Saved Products' },
]

export default function Sidebar() {
  const { logout } = useAuth()

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-950/80 px-4 py-6 text-slate-200 lg:flex">
      <div className="mb-8 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            eBay Dropshipping
          </div>
          <div className="text-sm font-medium text-slate-100">
            Market Analyzer
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 text-sm">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center rounded-md px-3 py-2 transition-colors ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300'
                  : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 border-t border-slate-800 pt-4">
        <Button
          variant="ghost"
          className="w-full justify-center text-xs"
          onClick={logout}
        >
          Logout
        </Button>
      </div>
      <p className="mt-4 text-[10px] leading-snug text-slate-500">
        This tool is for research purposes only. We are not affiliated with
        Amazon or eBay.
      </p>
    </aside>
  )
}

