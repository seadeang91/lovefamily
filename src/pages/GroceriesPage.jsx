import { useState, useEffect } from 'react'
import {
  collection, addDoc, deleteDoc, updateDoc, doc,
  onSnapshot, query, orderBy, Timestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

export default function GroceriesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [qty, setQty] = useState('1')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 댓글 state
  const [openCommentId, setOpenCommentId] = useState(null)
  const [commentsMap, setCommentsMap] = useState({})
  const [commentInput, setCommentInput] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'groceries'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  useEffect(() => {
    if (items.length === 0) return
    const unsubs = items.map((item) => {
      const q = query(collection(db, 'groceries', item.id, 'comments'), orderBy('createdAt'))
      return onSnapshot(q, (snap) => {
        setCommentsMap((prev) => ({
          ...prev,
          [item.id]: snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        }))
      })
    })
    return () => unsubs.forEach((u) => u())
  }, [items])

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'groceries'), {
        name: name.trim(),
        qty: qty.trim() || '1',
        checked: false,
        createdBy: user.email,
        createdByName: user.displayName || user.email,
        createdAt: Timestamp.now()
      })
      setName('')
      setQty('1')
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleCheck(item) {
    await updateDoc(doc(db, 'groceries', item.id), { checked: !item.checked })
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, 'groceries', id))
  }

  async function clearChecked() {
    if (!confirm('완료된 항목을 모두 삭제할까요?')) return
    const checked = items.filter((i) => i.checked)
    await Promise.all(checked.map((i) => deleteDoc(doc(db, 'groceries', i.id))))
  }

  async function handleAddComment(itemId) {
    if (!commentInput.trim()) return
    await addDoc(collection(db, 'groceries', itemId, 'comments'), {
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

  const checkedCount = items.filter((i) => i.checked).length

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-800">🌼 이번 주 장보기</h2>
          <p className="text-xs text-gray-400 mt-0.5">{items.length}개 항목 · {checkedCount}개 완료</p>
        </div>
        <div className="flex gap-2">
          {checkedCount > 0 && user?.email === 'seadeang91@gmail.com' && (
            <button onClick={clearChecked} className="text-xs text-red-400 border border-red-200 px-3 py-1.5 rounded-full">
              완료 삭제
            </button>
          )}
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-xs bg-[#F8BD0B] hover:opacity-80 text-gray-800 font-medium px-3 py-1.5 rounded-full"
          >
            + 추가
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-[#F8BD0B] p-4 mb-4 space-y-3 shadow-sm">
          <input
            type="text"
            placeholder="상품명"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F8BD0B]"
            autoFocus
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 flex-shrink-0">수량</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F8BD0B]"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="flex-1 bg-[#F8BD0B] hover:opacity-80 text-gray-800 font-medium py-2 rounded-xl text-sm disabled:opacity-60">
              추가
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">
              취소
            </button>
          </div>
        </form>
      )}

      {/* Items List */}
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-10">🌼 장보기 항목이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id}>
              <div
                className={`bg-white rounded-2xl border px-4 py-3 flex items-center gap-3 shadow-sm transition ${
                  item.checked ? 'opacity-50 border-gray-100' : 'border-[#F8BD0B]'
                }`}
              >
                <button
                  onClick={() => toggleCheck(item)}
                  className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
                    item.checked ? 'text-gray-800' : 'border-gray-300'
                  }`}
                  style={item.checked ? { backgroundColor: '#F8BD0B', borderColor: '#F8BD0B' } : {}}
                >
                  {item.checked && <span className="text-xs font-bold">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {item.name}
                    {parseInt(item.qty) >= 2 && <span className="text-gray-500 font-normal ml-1">{item.qty}개</span>}
                    {(commentsMap[item.id] || []).length > 0 && <span className="text-gray-400 font-normal ml-1">({(commentsMap[item.id] || []).length})</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.createdByName}</p>
                </div>
                <button
                  onClick={() => toggleComment(item.id)}
                  className={`text-lg leading-none transition ${openCommentId === item.id ? 'text-purple-400' : 'text-gray-300 hover:text-purple-400'}`}
                >
                  💬
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-400 text-xl leading-none">×</button>
              </div>

              {/* 댓글 패널 */}
              {openCommentId === item.id && (
                <div className="bg-purple-50 rounded-2xl border border-purple-200 p-3 mt-1 space-y-2">
                  {(commentsMap[item.id] || []).length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-1">아직 댓글이 없습니다</p>
                  ) : (
                    <div className="space-y-1.5">
                      {(commentsMap[item.id] || []).map((c) => (
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
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(item.id)}
                      placeholder="댓글 입력..."
                      className="flex-1 border border-purple-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-300"
                    />
                    <button
                      onClick={() => handleAddComment(item.id)}
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
    </div>
  )
}
