import { useState } from 'react'
import { updateProfile } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function NicknameModal({ onConfirm }) {
  const currentNickname = auth.currentUser?.displayName || ''
  const [nickname, setNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const finalNickname = nickname.trim() || currentNickname
    if (!finalNickname) return
    setSubmitting(true)
    try {
      await updateProfile(auth.currentUser, { displayName: finalNickname })
      await auth.currentUser.reload()
      onConfirm()
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🌼</div>
          <h2 className="text-xl font-bold text-gray-800">닉네임을 설정해주세요</h2>
          <p className="text-sm text-gray-500 mt-1">가족들에게 표시될 이름이에요</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={currentNickname || '예: 엄마, 아빠, 딸'}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={10}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F8BD0B]"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting || (!nickname.trim() && !currentNickname)}
            className="w-full bg-[#F8BD0B] hover:opacity-80 text-gray-800 font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {submitting ? '저장 중...' : '확인'}
          </button>
        </form>
      </div>
    </div>
  )
}
