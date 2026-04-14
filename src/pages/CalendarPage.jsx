import { useState, useEffect } from 'react'
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, Timestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'

dayjs.locale('ko')

const COLORS = ['bg-[#F8BD0B]', 'bg-[#B2D0D2]', 'bg-[#FFEED0]', 'bg-orange-300', 'bg-green-300']

export default function CalendarPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date'))
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const daysInMonth = () => {
    const start = currentMonth.startOf('month').startOf('week')
    const end = currentMonth.endOf('month').endOf('week')
    const days = []
    let day = start
    while (day.isBefore(end) || day.isSame(end, 'day')) {
      days.push(day)
      day = day.add(1, 'day')
    }
    return days
  }

  const eventsOnDate = (dateStr) => events.filter((e) => e.date === dateStr)

  async function handleAddEvent(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'events'), {
        title: title.trim(),
        date: selectedDate,
        allDay,
        startTime: allDay ? null : startTime,
        endTime: allDay ? null : endTime,
        createdBy: user.email,
        createdByName: user.displayName || user.email,
        createdAt: Timestamp.now()
      })
      setTitle('')
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('일정을 삭제할까요?')) return
    await deleteDoc(doc(db, 'events', id))
  }

  const days = daysInMonth()

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth((m) => m.subtract(1, 'month'))} className="p-2 rounded-full hover:bg-[#FFEED0] text-gray-600 text-xl">‹</button>
        <h2 className="text-base font-bold text-gray-800">
          🌼 {currentMonth.format('YYYY년 M월')}
        </h2>
        <button onClick={() => setCurrentMonth((m) => m.add(1, 'month'))} className="p-2 rounded-full hover:bg-[#FFEED0] text-gray-600 text-xl">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d} className={d === '일' ? 'text-red-400 font-medium' : d === '토' ? 'text-blue-400 font-medium' : ''}>{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5 mb-4">
        {days.map((day) => {
          const dateStr = day.format('YYYY-MM-DD')
          const isCurrentMonth = day.month() === currentMonth.month()
          const isToday = day.isSame(dayjs(), 'day')
          const isSelected = dateStr === selectedDate
          const dayEvents = eventsOnDate(dateStr)

          return (
            <div
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`
                min-h-[52px] rounded-xl p-1 cursor-pointer text-xs
                ${!isCurrentMonth ? 'opacity-25' : ''}
                ${isSelected ? 'bg-[#FFEED0] ring-2 ring-[#F8BD0B]' : 'hover:bg-[#FFEED0]/60'}
              `}
            >
              <div className={`
                w-6 h-6 flex items-center justify-center rounded-full mb-0.5 mx-auto font-medium
                ${isToday ? 'bg-[#F8BD0B] text-white font-bold' : ''}
                ${!isToday && day.day() === 0 ? 'text-red-400' : ''}
                ${!isToday && day.day() === 6 ? 'text-blue-400' : ''}
              `}>
                {day.date()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map((ev, i) => (
                  <div key={ev.id} className={`${COLORS[i % COLORS.length]} text-gray-700 rounded px-1 truncate text-center`} style={{ fontSize: '9px' }}>
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-gray-400" style={{ fontSize: '9px' }}>+{dayEvents.length - 2}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Date Events */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-gray-700">
            {dayjs(selectedDate).format('M월 D일 (ddd)')} 일정
          </h3>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-xs bg-[#F8BD0B] hover:opacity-80 text-gray-800 font-medium px-3 py-1.5 rounded-full"
          >
            + 추가
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddEvent} className="bg-white rounded-2xl border border-[#F8BD0B] p-4 mb-3 space-y-3 shadow-sm">
            <input
              type="text"
              placeholder="일정 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F8BD0B]"
              autoFocus
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} style={{ accentColor: '#F8BD0B' }} />
              하루 종일
            </label>
            {!allDay && (
              <div className="flex gap-2">
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-2 py-2 text-sm" />
                <span className="self-center text-gray-400">~</span>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-2 py-2 text-sm" />
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="flex-1 bg-[#F8BD0B] hover:opacity-80 text-gray-800 font-medium py-2 rounded-xl text-sm disabled:opacity-60">
                저장
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">
                취소
              </button>
            </div>
          </form>
        )}

        {eventsOnDate(selectedDate).length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">🌼 일정이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {eventsOnDate(selectedDate).map((ev) => (
              <div key={ev.id} className="bg-white rounded-2xl border border-[#F8BD0B] p-3 flex items-start justify-between shadow-sm">
                <div>
                  <p className="font-medium text-sm text-gray-800">{ev.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ev.allDay ? '하루 종일' : `${ev.startTime} ~ ${ev.endTime}`}
                    {' · '}{ev.createdByName}
                  </p>
                </div>
                <button onClick={() => handleDelete(ev.id)} className="text-gray-300 hover:text-red-400 text-xl leading-none ml-2">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
