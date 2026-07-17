import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import NicknameModal from './NicknameModal'
import WeeklyScheduleModal from './WeeklyScheduleModal'

export default function Layout() {
  const { user } = useAuth()
  const [showNickname, setShowNickname] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)

  return (
    <div className="flex flex-col bg-white" style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <header className="bg-[#ede7f6] text-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-lg font-bold">🐱 Love Family</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSchedule(true)} className="text-xl leading-none">
            🐶
          </button>
          <button
            onClick={() => setShowNickname(true)}
            className="text-xs bg-[#d9cff0] hover:opacity-80 text-gray-700 px-3 py-1 rounded-full font-medium"
          >
            {user?.displayName} ✏️
          </button>
        </div>
      </header>

      {showNickname && <NicknameModal onConfirm={() => setShowNickname(false)} />}
      {showSchedule && <WeeklyScheduleModal onClose={() => setShowSchedule(false)} />}

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
