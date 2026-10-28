import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Tender } from '../types/tender'
import { STATUS_LABELS } from '../types/tender'
import AddTenderModal from '../components/AddTenderModal'
import TenderDrawer from '../components/TenderDrawer'

function formatMoney(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('uk-UA').format(n) + ' ₴'
}

function daysLeft(iso: string | null) {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

function deadlineBadge(iso: string | null) {
  const d = daysLeft(iso)
  if (d === null) return null
  let cls = 'normal'
  if (d < 2) cls = 'red'
  else if (d < 5) cls = 'yellow'
  const text = d <= 0 ? 'сьогодні' : d === 1 ? 'завтра' : `${d} дн.`
  return <span className={`badge badge-deadline ${cls}`}>{text}</span>
}

const COUNTER_STATUSES: { key: string; label: string }[] = [
  { key: 'all', label: 'Усі' },
  { key: 'interesting', label: 'Цікаво' },
  { key: 'preparing', label: 'Готуємо' },
  { key: 'submitted', label: 'Подали' },
  { key: 'won', label: 'Виграли' },
  { key: 'lost', label: 'Програли' },
  { key: 'archive', label: 'Архів' },
]

export default function TenderList() {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [onlyStarred, setOnlyStarred] = useState(false)

  async function loadTenders() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setTenders([])
    } else {
      setTenders(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTenders()
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tenders.length }
    for (const s of ['interesting', 'preparing', 'submitted', 'won', 'lost', 'archive']) {
      c[s] = tenders.filter((t) => t.status === s).length
    }
    return c
  }, [tenders])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tenders.filter((t) => {
      if (onlyStarred && !t.starred) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (!q) return true
      return (
        t.title.toLowerCase().includes(q) ||
        t.customer.toLowerCase().includes(q) ||
        (t.prozorro_id || '').toLowerCase().includes(q)
      )
    })
  }, [tenders, search, statusFilter, onlyStarred])

  async function toggleStar(id: string, current: boolean, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const next = !current
    const { error } = await supabase
      .from('tenders')
      .update({ starred: next, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      alert('Помилка: ' + error.message)
      return
    }
    setTenders((prev) => prev.map((t) => (t.id === id ? { ...t, starred: next } : t)))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Додати тендер
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {COUNTER_STATUSES.map((item) => {
          const active = statusFilter === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              style={{
                background: 'var(--card)',
                border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                boxShadow: active ? '0 0 0 1px var(--accent)' : 'none',
                borderRadius: 8,
                padding: '10px 14px',
                minWidth: 88,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{counts[item.key] ?? 0}</div>
            </button>
          )
        })}
      </div>

      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 12,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук: назва, замовник, UA-..."
          style={{ flex: 1, minWidth: 180 }}
        />
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            cursor: 'pointer',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <input
            type="checkbox"
            checked={onlyStarred}
            onChange={(e) => setOnlyStarred(e.target.checked)}
          />
          Тільки обрані
        </label>
        {(search || statusFilter !== 'all' || onlyStarred) && (
          <button
            className="btn btn-sm"
            onClick={() => {
              setSearch('')
              setStatusFilter('all')
              setOnlyStarred(false)
            }}
          >
            Скинути
          </button>
        )}
      </div>

      {!loading && (
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
          {filtered.length} {filtered.length === 1 ? 'тендер' : filtered.length < 5 ? 'тендери' : 'тендерів'}
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          Помилка завантаження: {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Завантаження...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            {tenders.length === 0 ? 'Поки немає жодного тендера' : 'Нічого не знайдено'}
          </p>
          <p>
            {tenders.length === 0
              ? 'Натисніть «Додати тендер», щоб почати'
              : 'Спробуйте змінити пошук або фільтр'}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {filtered.map((t, idx) => (
            <div
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => setOpenId(t.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setOpenId(t.id)
                }
              }}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                padding: '12px 14px',
                borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                transition: 'background .12s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--row-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <button
                type="button"
                onClick={(e) => toggleStar(t.id, t.starred, e)}
                title={t.starred ? 'Прибрати з обраного' : 'В обране'}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  lineHeight: 1,
                  color: t.starred ? 'var(--star)' : 'var(--gray)',
                  padding: '2px 0',
                  flexShrink: 0,
                }}
              >
                {t.starred ? '★' : '☆'}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--muted)',
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <span>{t.customer}</span>
                  {t.status && (
                    <span className={`badge badge-status ${t.status}`}>
                      {STATUS_LABELS[t.status] || t.status}
                    </span>
                  )}
                  {t.prozorro_id && <span style={{ fontSize: 12 }}>№ {t.prozorro_id}</span>}
                </div>
              </div>

              <div
                style={{
                  textAlign: 'right',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 6,
                  minWidth: 100,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{formatMoney(t.budget)}</div>
                {deadlineBadge(t.deadline)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddTenderModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false)
            loadTenders()
          }}
        />
      )}

      {openId && (
        <TenderDrawer
          tenderId={openId}
          onClose={() => setOpenId(null)}
          onChanged={loadTenders}
        />
      )}
    </div>
  )
}
