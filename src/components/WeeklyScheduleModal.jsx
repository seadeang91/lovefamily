import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import ScheduleItemForm, { DAYS } from './ScheduleItemForm'

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8..20
const HEADER_ROW_HEIGHT = 20
const TIME_COL_WIDTH = 20
const ROW_HEIGHT = 35.2 // 기존 32px 대비 +10%
const GRID_HEIGHT = (HOURS.length - 1) * ROW_HEIGHT
const BOTTOM_PADDING = 12
const CONTENT_HEIGHT = HEADER_ROW_HEIGHT + GRID_HEIGHT + BOTTOM_PADDING
const MIN_ITEM_HEIGHT = ROW_HEIGHT
const MIN_ZOOM = 1 // 원래 크기 이하로는 축소되지 않도록 제한
const MAX_ZOOM = 2.2
const PALETTE = [
  '#FBD9D9', // pastel red
  '#FCE6C9', // pastel orange
  '#FBF6CC', // pastel yellow
  '#DCF0D3', // pastel green
  '#D3F0E7', // pastel mint
  '#D3E7F7', // pastel blue
  '#DFDCF6', // pastel indigo
  '#ECDCF6', // pastel purple
  '#F8DCEE', // pastel pink
  '#F1E7D3' // pastel beige
]

function toMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function hueDistance(i, j) {
  const d = Math.abs(i - j) % PALETTE.length
  return Math.min(d, PALETTE.length - d)
}

// 같은 요일에 함께 등장하는 스케쥴명끼리는 색상 계열이 겹치지 않도록 배정
function assignColors(items) {
  const seen = new Set()
  const titles = []
  for (const it of items) {
    const t = it.title.trim()
    if (!seen.has(t)) {
      seen.add(t)
      titles.push(t)
    }
  }
  titles.sort((a, b) => a.localeCompare(b, 'ko'))

  const adjacency = new Map(titles.map((t) => [t, new Set()]))
  const titlesByDay = new Map()
  for (const it of items) {
    const t = it.title.trim()
    for (const day of it.days || []) {
      if (!titlesByDay.has(day)) titlesByDay.set(day, new Set())
      titlesByDay.get(day).add(t)
    }
  }
  for (const dayTitles of titlesByDay.values()) {
    const arr = [...dayTitles]
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        adjacency.get(arr[i]).add(arr[j])
        adjacency.get(arr[j]).add(arr[i])
      }
    }
  }

  // 인접 요일 수가 많은(색상 구분이 까다로운) 항목부터 배정
  const order = [...titles].sort((a, b) => {
    const degDiff = adjacency.get(b).size - adjacency.get(a).size
    return degDiff !== 0 ? degDiff : a.localeCompare(b, 'ko')
  })

  const available = Array.from({ length: PALETTE.length }, (_, i) => i)
  const assigned = new Map()
  for (const t of order) {
    const neighborIdxs = [...adjacency.get(t)].map((n) => assigned.get(n)).filter((v) => v !== undefined)
    let bestIdx
    if (available.length === 0) {
      // 팔레트(10색)를 모두 사용한 경우에만 부득이하게 재사용
      bestIdx = order.indexOf(t) % PALETTE.length
    } else if (neighborIdxs.length === 0) {
      bestIdx = available[0]
    } else {
      let bestScore = -Infinity
      for (const idx of available) {
        const minDist = Math.min(...neighborIdxs.map((n) => hueDistance(idx, n)))
        if (minDist > bestScore) {
          bestScore = minDist
          bestIdx = idx
        }
      }
    }
    assigned.set(t, bestIdx)
    const pos = available.indexOf(bestIdx)
    if (pos !== -1) available.splice(pos, 1)
  }
  return assigned
}

export default function WeeklyScheduleModal({ onClose }) {
  const [title, setTitle] = useState('주간 스케쥴표')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [items, setItems] = useState([])
  const [formItem, setFormItem] = useState(null) // null | 'new' | item
  const [deleteMode, setDeleteMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [zoom, setZoom] = useState(1)
  const [naturalWidth, setNaturalWidth] = useState(0)
  const zoomRef = useRef(1)
  const viewportRef = useRef(null)
  const pinchState = useRef({ active: false, startDist: 0, startZoom: 1 })

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    setNaturalWidth(el.clientWidth)
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setNaturalWidth(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    function distance(touches) {
      return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)
    }
    function onTouchStart(e) {
      if (e.touches.length === 2) {
        pinchState.current = { active: true, startDist: distance(e.touches), startZoom: zoomRef.current }
      }
    }
    function onTouchMove(e) {
      if (pinchState.current.active && e.touches.length === 2) {
        e.preventDefault()
        const scale = distance(e.touches) / pinchState.current.startDist
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchState.current.startZoom * scale))
        zoomRef.current = next
        setZoom(next)
      }
    }
    function onTouchEnd(e) {
      if (e.touches.length < 2) pinchState.current.active = false
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [])

  useEffect(() => {
    return onSnapshot(doc(db, 'weeklyScheduleSettings', 'main'), (snap) => {
      if (snap.exists() && snap.data().title) setTitle(snap.data().title)
    })
  }, [])

  useEffect(() => {
    return onSnapshot(collection(db, 'weeklySchedules'), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [])

  async function saveTitle() {
    const t = titleDraft.trim() || '주간 스케쥴표'
    await setDoc(doc(db, 'weeklyScheduleSettings', 'main'), { title: t }, { merge: true })
    setEditingTitle(false)
  }

  async function handleDeleteClick() {
    if (deleteMode) {
      if (selectedIds.size > 0) {
        const daysToRemoveByItemId = new Map()
        for (const key of selectedIds) {
          const [itemId, dayKey] = key.split('|')
          if (!daysToRemoveByItemId.has(itemId)) daysToRemoveByItemId.set(itemId, new Set())
          daysToRemoveByItemId.get(itemId).add(dayKey)
        }
        await Promise.all(
          [...daysToRemoveByItemId.entries()].map(([itemId, removedDays]) => {
            const item = items.find((it) => it.id === itemId)
            if (!item) return null
            const remainingDays = item.days.filter((d) => !removedDays.has(d))
            return remainingDays.length === 0
              ? deleteDoc(doc(db, 'weeklySchedules', itemId))
              : updateDoc(doc(db, 'weeklySchedules', itemId), { days: remainingDays })
          })
        )
      }
      setDeleteMode(false)
      setSelectedIds(new Set())
    } else {
      setDeleteMode(true)
    }
  }

  const colorAssignment = useMemo(() => assignColors(items), [items])

  function colorForItem(item) {
    const idx = colorAssignment.get(item.title.trim()) ?? 0
    return PALETTE[idx % PALETTE.length]
  }

  const dayColWidth = naturalWidth ? (naturalWidth - TIME_COL_WIDTH) / DAYS.length : 0

  function handleItemClick(item, dayKey) {
    if (!deleteMode) return
    const key = `${item.id}|${dayKey}`
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
              maxLength={20}
              className="text-lg font-bold text-gray-800 border-b border-[#F8BD0B] focus:outline-none flex-1 mr-2"
            />
          ) : (
            <h2
              onDoubleClick={() => {
                setTitleDraft(title)
                setEditingTitle(true)
              }}
              className="text-lg font-bold text-gray-800"
            >
              🐶 {title}
            </h2>
          )}
          <button onClick={onClose} className="text-gray-400 text-xl leading-none px-1">✕</button>
        </div>

        <div className="flex items-center justify-end gap-2 mb-3">
          {deleteMode && (
            <span className="text-xs text-gray-400 mr-auto">
              {selectedIds.size}개 선택됨 · 삭제할 항목을 눌러주세요
            </span>
          )}
          <button
            onClick={() => setFormItem('new')}
            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-full font-medium"
          >
            + 추가
          </button>
          <button
            onClick={handleDeleteClick}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition ${
              deleteMode ? 'bg-red-400 text-white border-red-400' : 'text-red-400 border-red-200'
            }`}
          >
            {deleteMode ? `삭제(${selectedIds.size})` : '삭제'}
          </button>
        </div>

        <div ref={viewportRef} style={{ overflow: 'auto', height: CONTENT_HEIGHT }}>
          <div style={{ width: naturalWidth * zoom }}>
            <div
              className="flex text-xs sticky top-0 z-10 bg-white"
              style={{ height: HEADER_ROW_HEIGHT }}
            >
              <div style={{ width: TIME_COL_WIDTH * zoom, flexShrink: 0 }} />
              {DAYS.map((d) => (
                <div
                  key={d.key}
                  className="text-center font-medium text-gray-600 flex items-center justify-center"
                  style={{ width: dayColWidth * zoom, flexShrink: 0 }}
                >
                  {d.label}
                </div>
              ))}
            </div>

            <div
              style={{
                width: naturalWidth * zoom,
                height: (GRID_HEIGHT + BOTTOM_PADDING) * zoom,
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: naturalWidth || '100%',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
                className="flex text-xs pb-3"
              >
                <div style={{ width: TIME_COL_WIDTH }}>
                  <div className="relative" style={{ height: GRID_HEIGHT }}>
                    {HOURS.map((h, i) => (
                      <span
                        key={h}
                        className="absolute left-0 text-[9px] text-gray-400"
                        style={{ top: i * ROW_HEIGHT - 5 }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                {DAYS.map((d) => {
                  const dayItems = items.filter((it) => it.days.includes(d.key))
                  return (
                    <div key={d.key} className="flex-1 min-w-0">
                      <div className="relative border-l border-gray-100" style={{ height: GRID_HEIGHT }}>
                        {HOURS.slice(0, -1).map((h, i) => (
                          <div
                            key={h}
                            className="absolute left-0 right-0 border-t border-gray-100"
                            style={{ top: i * ROW_HEIGHT }}
                          />
                        ))}
                        {dayItems.map((item) => {
                          const top = ((toMinutes(item.startTime) - 8 * 60) / 60) * ROW_HEIGHT
                          const height = Math.max(
                            ((toMinutes(item.endTime) - toMinutes(item.startTime)) / 60) * ROW_HEIGHT,
                            MIN_ITEM_HEIGHT
                          )
                          const selected = selectedIds.has(`${item.id}|${d.key}`)
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleItemClick(item, d.key)}
                              onDoubleClick={() => !deleteMode && setFormItem(item)}
                              className="absolute left-0.5 right-0.5 rounded-md px-1 overflow-hidden cursor-pointer flex flex-col items-center justify-center text-center"
                              style={{
                                top,
                                height,
                                backgroundColor: colorForItem(item),
                                opacity: deleteMode && !selected ? 0.45 : 1
                              }}
                            >
                              {selected && (
                                <span className="absolute top-0 right-0.5 text-[10px] text-gray-800">✓</span>
                              )}
                              <p className="text-[9px] leading-tight text-gray-800 font-medium truncate w-full">
                                {item.title}
                              </p>
                              <p className="text-[7px] leading-none text-gray-600 whitespace-nowrap">
                                {item.startTime}
                              </p>
                              <p className="text-[7px] leading-none text-gray-600 whitespace-nowrap">
                                ~{item.endTime}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {formItem && (
          <ScheduleItemForm item={formItem === 'new' ? null : formItem} onClose={() => setFormItem(null)} />
        )}
      </div>
    </div>
  )
}
