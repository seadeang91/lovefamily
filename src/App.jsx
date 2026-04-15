import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from './lib/firebase'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import CalendarPage from './pages/CalendarPage'
import GroceriesPage from './pages/GroceriesPage'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (user?.displayName) {
      setDoc(doc(db, 'members', user.uid), {
        nickname: user.displayName,
        email: user.email,
        updatedAt: serverTimestamp()
      }, { merge: true })
    }
  }, [user?.uid, user?.displayName])

  if (loading) return <div className="flex items-center justify-center h-screen text-[#F8BD0B] text-lg">🌼 로딩 중...</div>
  if (!user) return <Navigate to="/login" replace />
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
