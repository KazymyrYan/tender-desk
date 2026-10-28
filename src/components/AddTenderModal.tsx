import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchProzorroTender } from '../lib/prozorro'
import type { TenderItem } from '../types/tender'

interface Props {
  onClose: () => void
  onAdded: () => void
}

type Mode = 'prozorro' | 'manual'

export default function AddTenderModal({ onClose, onAdded }: Props) {
  const [mode, setMode] = useState<Mode>('prozorro')
  const [prozorroId, setProzorroId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Manual fields
  const [title, setTitle] = useState('')
  const [customer, setCustomer] = useState('')
  const [budget, setBudget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [itemsText, setItemsText] = useState('')

  async function handleProzorroSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prozorroId.trim()) return

    setLoading(true)
    setError(null)

    try {
      const data = await fetchProzorroTender(prozorroId)

      const { error: insertError } = await supabase.from('tenders').insert({
        prozorro_id: data.prozorro_id,
        title: data.title,
        customer: data.customer,
        budget: data.budget,
        currency: data.currency,
        deadline: data.deadline,
        items: data.items,
        notes: '',
        prozorro_url: data.prozorro_url,
        starred: false,
        status: 'interesting',
        source: 'prozorro',
      })

      if (insertError) throw insertError
      onAdded()
    } catch (err: any) {
      setError(err.message || 'Помилка при додаванні')
    } finally {
      setLoading(false)
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Назва обовʼязкова')
      return
    }

    setLoading(true)
    setError(null)

    const items: TenderItem[] = itemsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((description) => ({ description }))

    try {
      const { error: insertError } = await supabase.from('tenders').insert({
        prozorro_id: null,
        title: title.trim(),
        customer: customer.trim() || '—',
        budget: budget ? Number(budget) : null,
        currency: 'UAH',
        deadline: deadline || null,
        items,
        notes: notes.trim(),
        prozorro_url: null,
        starred: false,
        status: 'interesting',
        source: 'manual',
      })

      if (insertError) throw insertError
      onAdded()
    } catch (err: any) {
      setError(err.message || 'Помилка при додаванні')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Додати тендер</h3>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '12px 20px', display: 'flex', gap: 8, borderBottom: '1px solid var(--border)' }}>
          <button
            className={`btn btn-sm ${mode === 'prozorro' ? 'btn-primary' : ''}`}
            onClick={() => setMode('prozorro')}
          >
            З Прозорро
          </button>
          <button
            className={`btn btn-sm ${mode === 'manual' ? 'btn-primary' : ''}`}
            onClick={() => setMode('manual')}
          >
            Вручну
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
              {error}
            </div>
          )}

          {mode === 'prozorro' ? (
            <form onSubmit={handleProzorroSubmit}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>
                Номер UA-..., посилання або внутрішній ID (32 символи)
              </label>
              <input
                type="text"
                value={prozorroId}
                onChange={(e) => setProzorroId(e.target.value)}
                placeholder="UA-2026-... або f22c4eddd1c74fe180bdd8a901ecc61e"
                style={{ width: '100%', marginBottom: 16 }}
                autoFocus
              />
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                Дані (назва, замовник, бюджет, позиції, дедлайн) будуть підтягнуті автоматично з API Прозорро.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={onClose}>Скасувати</button>
                <button type="submit" className="btn btn-primary" disabled={loading || !prozorroId.trim()}>
                  {loading ? 'Завантаження...' : 'Додати'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleManualSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}>Назва *</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}>Замовник</label>
                  <input type="text" value={customer} onChange={(e) => setCustomer(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}>Бюджет (грн)</label>
                    <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} style={{ width: '100%' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}>Дедлайн</label>
                    <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}>
                    Позиції (кожна з нового рядка)
                  </label>
                  <textarea
                    value={itemsText}
                    onChange={(e) => setItemsText(e.target.value)}
                    rows={3}
                    style={{ width: '100%', resize: 'vertical' }}
                    placeholder="Товар 1&#10;Товар 2"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}>Примітки</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn" onClick={onClose}>Скасувати</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Збереження...' : 'Додати'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
