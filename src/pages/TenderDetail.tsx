import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Tender } from '../types/tender'
import { STATUS_OPTIONS } from '../types/tender'

function formatMoney(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('uk-UA').format(n) + ' ₴'
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TenderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tender, setTender] = useState<Tender | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'info' | 'notes'>('info')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      const { data, error } = await supabase.from('tenders').select('*').eq('id', id).single()
      if (error) {
        setError(error.message)
      } else {
        setTender(data)
        setNotes(data.notes || '')
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function updateStatus(status: string | null) {
    if (!tender) return
    const { error } = await supabase
      .from('tenders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', tender.id)
    if (!error) {
      setTender({ ...tender, status: status as any })
    }
  }

  async function saveNotes() {
    if (!tender) return
    setSaving(true)
    const { error } = await supabase
      .from('tenders')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', tender.id)
    if (!error) {
      setTender({ ...tender, notes })
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!tender) return
    if (!confirm(`Видалити тендер?\n\n${tender.title}`)) return

    const { error } = await supabase.from('tenders').delete().eq('id', tender.id)
    if (error) {
      alert('Помилка видалення: ' + error.message)
      return
    }
    navigate('/')
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Завантаження...</p>
  if (error || !tender) {
    return (
      <div>
        <p style={{ color: 'var(--red)' }}>{error || 'Тендер не знайдено'}</p>
        <Link to="/" className="btn" style={{ marginTop: 12 }}>← Назад до списку</Link>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>
          ← Назад до списку
        </Link>
        <button
          className="btn btn-sm"
          style={{ color: 'var(--red)', borderColor: '#fecaca' }}
          onClick={handleDelete}
        >
          Видалити тендер
        </button>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <button
            type="button"
            onClick={async () => {
              const next = !tender.starred
              const { error } = await supabase
                .from('tenders')
                .update({ starred: next, updated_at: new Date().toISOString() })
                .eq('id', tender.id)
              if (!error) setTender({ ...tender, starred: next })
            }}
            title={tender.starred ? 'Прибрати з обраного' : 'В обране'}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 22,
              lineHeight: 1,
              color: tender.starred ? 'var(--star)' : 'var(--gray)',
              padding: 0,
            }}
          >
            {tender.starred ? '★' : '☆'}
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{tender.title}</h1>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
          <span>{tender.customer}</span>
          {tender.prozorro_id && <span>{tender.prozorro_id}</span>}
          <span>{formatMoney(tender.budget)}</span>
          {tender.deadline && <span>Дедлайн: {formatDate(tender.deadline)}</span>}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, color: 'var(--muted)' }}>Статус:</label>
          <select
            value={tender.status || ''}
            onChange={(e) => updateStatus(e.target.value || null)}
            style={{ minWidth: 140 }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={String(o.value)} value={o.value || ''}>
                {o.label}
              </option>
            ))}
          </select>

          {tender.prozorro_url && (
            <a
              href={tender.prozorro_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm"
            >
              Відкрити на Прозорро ↗
            </a>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <button
          className="btn btn-sm"
          style={{
            borderRadius: '6px 6px 0 0',
            borderBottom: tab === 'info' ? '2px solid var(--accent)' : '2px solid transparent',
            background: tab === 'info' ? 'var(--card)' : 'transparent',
          }}
          onClick={() => setTab('info')}
        >
          Інформація про тендер
        </button>
        <button
          className="btn btn-sm"
          style={{
            borderRadius: '6px 6px 0 0',
            borderBottom: tab === 'notes' ? '2px solid var(--accent)' : '2px solid transparent',
            background: tab === 'notes' ? 'var(--card)' : 'transparent',
          }}
          onClick={() => setTab('notes')}
        >
          Примітки
        </button>
      </div>

      {tab === 'info' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Позиції</h3>
          {tender.items && tender.items.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Опис</th>
                  <th style={{ padding: '6px 8px' }}>Кількість</th>
                  <th style={{ padding: '6px 8px' }}>Од.</th>
                </tr>
              </thead>
              <tbody>
                {tender.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px' }}>{item.description}</td>
                    <td style={{ padding: '8px' }}>{item.quantity ?? '—'}</td>
                    <td style={{ padding: '8px' }}>{item.unit ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--muted)' }}>Позиції не вказані</p>
          )}
          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
            У майбутньому тут буде можливість вивантажити інформацію в Word-файл.
          </p>
        </div>
      )}

      {tab === 'notes' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            style={{ width: '100%', resize: 'vertical', marginBottom: 12 }}
            placeholder="Ваші примітки щодо тендера..."
          />
          <button className="btn btn-primary btn-sm" onClick={saveNotes} disabled={saving}>
            {saving ? 'Збереження...' : 'Зберегти примітки'}
          </button>
        </div>
      )}
    </div>
  )
}
