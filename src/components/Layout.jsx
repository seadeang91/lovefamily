import { Outlet, NavLink } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

export default function Layout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-[#fff9be] text-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-lg font-bold">🐱 Love Family</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{user?.displayName}</span>
          <button
            onClick={() => signOut(auth)}
            className="text-xs bg-[#FFEED0] hover:opacity-80 text-gray-700 px-3 py-1 rounded-full font-medium"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#d0c6e9] flex shadow-lg">
        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 text-xs gap-1 transition ${isActive ? 'text-[#F8BD0B] font-semibold' : 'text-gray-400'}`
          }
        >
          <span className="text-xl">📅</span>
          캘린더
        </NavLink>
        <NavLink
          to="/groceries"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 text-xs gap-1 transition ${isActive ? 'text-[#F8BD0B] font-semibold' : 'text-gray-400'}`
          }
        >
          <span className="text-xl">🛒</span>
          장보기
        </NavLink>
      </nav>
    </div>
  )
}
