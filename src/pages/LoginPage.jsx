import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null
  if (user) return <Navigate to="/calendar" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/calendar')
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="fixed top-10 left-6 text-5xl opacity-20 select-none">🌼</div>
      <div className="fixed top-32 right-8 text-3xl opacity-15 select-none">🌼</div>
      <div className="fixed bottom-20 left-10 text-4xl opacity-15 select-none">🌼</div>
      <div className="fixed bottom-10 right-6 text-5xl opacity-20 select-none">🌼</div>

      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm relative border border-gray-100">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🐱</div>
          <h1 className="text-2xl font-bold text-gray-800">Love Family</h1>
          <p className="text-gray-400 text-sm mt-1">가족 전용 앱에 오신 것을 환영해요 🌼</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F8BD0B]"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F8BD0B]"
              placeholder="비밀번호 입력"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#F8BD0B] hover:opacity-80 text-gray-800 font-semibold py-3 rounded-xl transition disabled:opacity-60"
          >
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
