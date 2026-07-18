import { useState } from 'react'
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export const DAYS = [
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
  { key: 'sat', label: '토' }
]

const SELECT_HOURS = Array.from({ length: 13 }, (_, i) => String(i + 8).padStart(2, '0')) // 08..20
const SELECT_MINUTES = ['00', '10', '20', '30', '40', '50']

function toMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function TimeSelect({ label, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [hour, setHour] = useState(value.split(':')[0])

  function openPanel() {
    setHour(value.split(':')[0])
    setOpen(true)
  }

  function pickMinute(minute) {
    onChange(`${hour}:${minute}`)
    setOpen(false)
  }

  return (
    <div className="relative">
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#F8BD0B]"
      >
        {value}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[65]" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-[70] flex overflow-hidden">
            <div className="max-h-40 overflow-y-auto py-1">
              {SELECT_HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHour(h)}
                  className={`block w-12 px-2 py-1.5 text-sm text-center ${
                    h === hour ? 'bg-[#F8BD0B] text-gray-800 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="max-h-40 overflow-y-auto py-1 border-l border-gray-100">
              {SELECT_MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => pickMinute(m)}
                  className="block w-12 px-2 py-1.5 text-sm text-center text-gray-600 hover:bg-gray-50"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function ScheduleItemForm({ item, onClose }) {
  const [days, setDays] = useState(item?.days || ['mon'])
  const [startTime, setStartTime] = useState(item?.startTime || '09:00')
  const [endTime, setEndTime] = useState(item?.endTime || '10:00')
  const [title, setTitle] = useState(item?.title || '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function toggleDay(key) {
    setDays((prev) => (prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (days.length === 0) {
      setError('요일을 선택해주세요.')
      return
    }
    if (!title.trim()) {
      setError('스케쥴 내용을 입력해주세요.')
      return
    }
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      setError('종료 시간은 시작 시간보다 늦어야 해요.')
      return
    }
    setSubmitting(true)
    try {
      const data = { days, startTime, endTime, title: title.trim() }
      if (item) {
        await updateDoc(doc(db, 'weeklySchedules', item.id), data)
      } else {
        await addDoc(collection(db, 'weeklySchedules'), { ...data, createdAt: Date.now() })
      }
      onClose()
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">{item ? '스케쥴 수정' : '스케쥴 추가'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-1.5">요일 (복수 선택 가능)</p>
            <div className="grid grid-cols-6 gap-1">
              {DAYS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggleDay(d.key)}
                  className={`text-sm py-2 rounded-lg font-medium transition ${
                    days.includes(d.key) ? 'bg-[#F8BD0B] text-gray-800' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <TimeSelect label="시작" value={startTime} onChange={setStartTime} />
            </div>
            <span className="text-gray-400 text-sm mt-5">~</span>
            <div className="flex-1">
              <TimeSelect label="종료" value={endTime} onChange={setEndTime} />
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1.5">스케쥴</p>
            <input
              type="text"
              placeholder="예: 수영 강습"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={20}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F8BD0B]"
              autoFocus
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-600 font-medium py-2.5 rounded-xl transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#F8BD0B] hover:opacity-80 text-gray-800 font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
