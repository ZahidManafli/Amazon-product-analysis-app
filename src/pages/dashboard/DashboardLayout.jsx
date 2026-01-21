import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/Layout/Sidebar.jsx'
import Topbar from '../../components/Layout/Topbar.jsx'

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-4 lg:px-8 lg:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

