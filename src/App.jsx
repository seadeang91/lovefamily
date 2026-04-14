import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import CalendarPage from './pages/CalendarPage'
import GroceriesPage from './pages/GroceriesPage'
import Layout from './components/Layout'
import NicknameModal from './components/NicknameModal'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-[#F8BD0B] text-lg">🌼 로딩 중...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!user.displayName) return <NicknameModal />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="groceries" element={<GroceriesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
