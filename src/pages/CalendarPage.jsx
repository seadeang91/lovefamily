import { useState, useEffect } from 'react'
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, Timestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import { Sun, Moon } from 'lucide-react'

dayjs.locale('ko')

const COLORS = ['bg-[#F8BD0B]', 'bg-[#c8b4f0]', 'bg-[#FFEED0]', 'bg-orange-300', 'bg-green-300']

const sortDuties = (list) => [...list].sort((a) => (a.type === '아침당번' || a.type === '오전당번' ? -1 : 1))

const HOLIDAYS = new Set([
  // 2025
  '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30',
  '2025-03-01', '2025-05-05', '2025-06-06', '2025-08-15',
  '2025-10-03', '2025-10-05', '2025-10-06', '2025-10-07',
  '2025-10-09', '2025-12-25',
  // 2026
  '2026-01-01', '2026-01-28', '2026-01-29', '2026-01-30',
  '2026-03-01', '2026-05-05', '2026-05-24', '2026-06-06',
  '2026-08-15', '2026-09-24', '2026-09-25', '2026-09-26',
  '2026-10-03', '2026-10-09', '2026-12-25',
])

export default function CalendarPage() {
  const { user } = useAuth()

  // 일정 state
  const [events, setEvents] = useState([])
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState('09:00')
  const [submitting, setSubmitting] = useState(false)

  // 당번 state
  const [duties, setDuties] = useState([])
  const [members, setMembers] = useState([])
  const [showDutyForm, setShowDutyForm] = useState(false)
  const [dutyType, setDutyType] = useState('아침당번')
  const [dutyNickname, setDutyNickname] = useState('')
  const [dutyStartDate, setDutyStartDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [dutyEndDate, setDutyEndDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [dutySubmitting, setDutySubmitting] = useState(false)

  // 댓글 state
  const [openCommentId, setOpenCommentId] = useState(null)
  const [commentsMap, setCommentsMap] = useState({})
  const [commentInput, setCommentInput] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date'))
    return onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'duties'), orderBy('startDate'))
    return onSnapshot(q, (snap) => {
      setDuties(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [])

  useEffect(() => {
    return onSnapshot(collection(db, 'members'), (snap) => {
      setMembers(snap.docs.map((d) => d.data().nickname).filter(Boolean))
    })
  }, [])

  useEffect(() => {
    if (user?.displayName && !dutyNickname) {
      setDutyNickname(user.displayName)
    }
  }, [user?.displayName])

  useEffect(() => {
    if (events.length === 0) return
    const unsubs = events.map((ev) => {
      const q = query(collection(db, 'events', ev.id, 'comments'), orderBy('createdAt'))
      return onSnapshot(q, (snap) => {
        setCommentsMap((prev) => ({
          ...prev,
          [ev.id]: snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        }))
      })
    })
    return () => unsubs.forEach((u) => u())
  }, [events])

  useEffect(() => {
    setDutyStartDate(selectedDate)
    setDutyEndDate(selectedDate)
  }, [selectedDate])

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

  const eventsOnDate = (dateStr) =>
    events
      .filter((e) => e.date === dateStr)
      .sort((a, b) => {
        if (a.allDay && !b.allDay) return -1
        if (!a.allDay && b.allDay) return 1
        if (!a.allDay && !b.allDay) return (a.startTime || '').localeCompare(b.startTime || '')
        return 0
      })
  const dutiesOnDate = (dateStr) => duties.filter((d) => d.startDate <= dateStr && d.endDate >= dateStr)

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

  async function handleAddDuty(e) {
    e.preventDefault()
    if (!dutyNickname) return
    setDutySubmitting(true)
    try {
      await addDoc(collection(db, 'duties'), {
        type: dutyType,
        nickname: dutyNickname,
        startDate: dutyStartDate,
        endDate: dutyEndDate,
        createdBy: user.email,
        createdByName: user.displayName || user.email,
        createdAt: Timestamp.now()
      })
      setShowDutyForm(false)
    } finally {
      setDutySubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('일정을 삭제할까요?')) return
    await deleteDoc(doc(db, 'events', id))
  }

  async function handleDeleteDuty(id) {
    if (!confirm('당번을 삭제할까요?')) return
    await deleteDoc(doc(db, 'duties', id))
  }

  async function handleAddComment(eventId) {
    if (!commentInput.trim()) return
    await addDoc(collection(db, 'events', eventId, 'comments'), {
      text: commentInput.trim(),
      createdBy: user.email,
      createdByName: user.displayName || user.email,
      createdAt: Timestamp.now()
    })
    setCommentInput('')
  }

  function toggleComment(id) {
    if (openCommentId === id) {
      setOpenCommentId(null)
    } else {
      setOpenCommentId(id)
      setCommentInput('')
    }
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
          const isHoliday = HOLIDAYS.has(dateStr)
          const dayEvents = eventsOnDate(dateStr)
          const dayDuties = dutiesOnDate(dateStr)

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
                ${!isToday && (day.day() === 0 || isHoliday) ? 'text-red-400' : ''}
                ${!isToday && !isHoliday && day.day() === 6 ? 'text-blue-400' : ''}
              `}>
                {day.date()}
              </div>
              <div className="space-y-0.5">
                {/* 1) 당번 dot - 항상 첫 번째 줄 */}
                <div className="flex justify-center gap-0.5 h-2">
                  {sortDuties(dayDuties).map((duty) => (
                    <span
                      key={duty.id}
                      className={`inline-block w-1.5 h-1.5 rounded-full self-center ${(duty.type === '아침당번' || duty.type === '오전당번') ? 'bg-orange-400' : 'bg-sky-400'}`}
                    />
                  ))}
                </div>
                {/* 2) 일정 pill - 항상 두 번째 줄 */}
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

      {/* Selected Date Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-gray-700">
            {dayjs(selectedDate).format('M월 D일 (ddd)')} 일정
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowDutyForm(false); setShowForm((v) => !v) }}
              className="text-xs bg-[#F8BD0B] hover:opacity-80 text-gray-800 font-medium px-3 py-1.5 rounded-full"
            >
              + 일정
            </button>
            <button
              onClick={() => { setShowForm(false); setShowDutyForm((v) => !v) }}
              className="text-xs bg-[#c8b4f0] hover:opacity-80 text-gray-800 font-medium px-3 py-1.5 rounded-full"
            >
              + 당번
            </button>
          </div>
        </div>

        {/* 일정 추가 폼 */}
        {showForm && (
          <form onSubmit={handleAddEvent} className="bg-white rounded-2xl border border-[#F8BD0B] p-4 mb-3 space-y-3 shadow-sm overflow-hidden">
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
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
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

        {/* 당번 등록 폼 */}
        {showDutyForm && (
          <form onSubmit={handleAddDuty} className="bg-white rounded-2xl border border-[#c8b4f0] p-4 mb-3 space-y-3 shadow-sm">
            <div className="flex gap-2">
              <select
                value={dutyType}
                onChange={(e) => setDutyType(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8b4f0]"
              >
                <option value="아침당번">아침당번</option>
                <option value="저녁당번">저녁당번</option>
              </select>
              <select
                value={dutyNickname}
                onChange={(e) => setDutyNickname(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8b4f0]"
              >
                {members.length === 0
                  ? <option value={user?.displayName}>{user?.displayName}</option>
                  : members.map((m) => <option key={m} value={m}>{m}</option>)
                }
              </select>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dutyStartDate}
                onChange={(e) => setDutyStartDate(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <span className="text-gray-400 text-sm">~</span>
              <input
                type="date"
                value={dutyEndDate}
                onChange={(e) => setDutyEndDate(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={dutySubmitting} className="flex-1 bg-[#c8b4f0] hover:opacity-80 text-gray-800 font-medium py-2 rounded-xl text-sm disabled:opacity-60">
                저장
              </button>
              <button type="button" onClick={() => setShowDutyForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">
                취소
              </button>
            </div>
          </form>
        )}

        {/* 당번 목록 - 아침(왼쪽) / 저녁(오른쪽) */}
        {dutiesOnDate(selectedDate).length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="space-y-2">
              {dutiesOnDate(selectedDate)
                .filter(d => d.type === '아침당번' || d.type === '오전당번')
                .map(duty => (
                  <div key={duty.id} className="bg-white rounded-2xl border border-purple-200 p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-gray-700 flex-shrink-0 flex items-center gap-1"><Sun className="w-3 h-3" /> 아침</span>
                      <span className="text-sm font-medium text-gray-800 truncate">{duty.nickname}</span>
                    </div>
                    <button onClick={() => handleDeleteDuty(duty.id)} className="text-gray-300 hover:text-red-400 text-xl leading-none ml-1 flex-shrink-0">×</button>
                  </div>
                ))}
            </div>
            <div className="space-y-2">
              {dutiesOnDate(selectedDate)
                .filter(d => d.type === '저녁당번' || d.type === '오후당번')
                .map(duty => (
                  <div key={duty.id} className="bg-white rounded-2xl border border-purple-200 p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sky-100 text-gray-700 flex-shrink-0 flex items-center gap-1"><Moon className="w-3 h-3" /> 저녁</span>
                      <span className="text-sm font-medium text-gray-800 truncate">{duty.nickname}</span>
                    </div>
                    <button onClick={() => handleDeleteDuty(duty.id)} className="text-gray-300 hover:text-red-400 text-xl leading-none ml-1 flex-shrink-0">×</button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 일정 목록 */}
        {eventsOnDate(selectedDate).length > 0 && (
          <div className="space-y-2">
            {eventsOnDate(selectedDate).map((ev) => (
              <div key={ev.id}>
                <div className="bg-white rounded-2xl border border-[#F8BD0B] p-3 flex items-start justify-between shadow-sm">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-800">
                      {ev.title}
                      {(commentsMap[ev.id] || []).length > 0 && <span className="text-gray-400 font-normal ml-1">({(commentsMap[ev.id] || []).length})</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ev.allDay ? '하루 종일' : ev.startTime}
                      {' · '}{ev.createdByName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => toggleComment(ev.id)}
                      className={`text-lg leading-none transition ${openCommentId === ev.id ? 'text-purple-400' : 'text-gray-300 hover:text-purple-400'}`}
                    >
                      💬
                    </button>
                    <button onClick={() => handleDelete(ev.id)} className="text-gray-300 hover:text-red-400 text-xl leading-none">×</button>
                  </div>
                </div>

                {/* 댓글 패널 */}
                {openCommentId === ev.id && (
                  <div className="bg-purple-50 rounded-2xl border border-purple-200 p-3 mt-1 space-y-2">
                    {(commentsMap[ev.id] || []).length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-1">아직 댓글이 없습니다</p>
                    ) : (
                      <div className="space-y-1.5">
                        {(commentsMap[ev.id] || []).map((c) => (
                          <div key={c.id} className="text-xs text-gray-600">
                            <span className="font-semibold text-purple-600">{c.createdByName}</span>
                            <span className="text-gray-400 mx-1">·</span>
                            {c.text}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <input
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(ev.id)}
                        placeholder="댓글 입력..."
                        className="flex-1 border border-purple-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-300"
                      />
                      <button
                        onClick={() => handleAddComment(ev.id)}
                        className="bg-[#c8b4f0] hover:opacity-80 text-gray-800 px-3 py-1.5 rounded-xl text-xs font-medium"
                      >
                        등록
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {eventsOnDate(selectedDate).length === 0 && dutiesOnDate(selectedDate).length === 0 && (
          <p className="text-gray-400 text-sm text-center py-6">🌼 일정이 없습니다</p>
        )}
      </div>
    </div>
  )
}
