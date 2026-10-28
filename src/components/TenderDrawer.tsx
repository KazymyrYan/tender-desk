import { useState, useEffect } from 'react'
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

interface Props {
  tenderId: string
  onClose: () => void
  onChanged: () => void
}

export default function TenderDrawer({ tenderId, onClose, onChanged }: Props) {
  const [tender, setTender] = useState<Tender | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview' | 'info'>('overview')
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  // Editable fields
  const [notes, setNotes] = useState('')
  const [itemsNotes, setItemsNotes] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [company, setCompany] = useState('')
  const [needBank, setNeedBank] = useState(false)
  const [needSecurity, setNeedSecurity] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase.from('tenders').select('*').eq('id', tenderId).single()
      if (cancelled) return
      if (error) {
        setError(error.message)
        setTender(null)
      } else {
        setTender(data)
        setNotes(data.notes || '')
        setItemsNotes(data.items_notes || '')
        setPaymentTerms(data.payment_terms || '')
        setCompany(data.company || '')
        setNeedBank(!!data.need_bank_guarantee)
        setNeedSecurity(!!data.need_contract_security)
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [tenderId])

  async function updateStatus(status: string | null) {
    if (!tender) return
    const { error } = await supabase
      .from('tenders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', tender.id)
    if (!error) {
      setTender({ ...tender, status: status as any })
      onChanged()
    }
  }

  async function toggleStar() {
    if (!tender) return
    const next = !tender.starred
    const { error } = await supabase
      .from('tenders')
      .update({ starred: next, updated_at: new Date().toISOString() })
      .eq('id', tender.id)
    if (!error) {
      setTender({ ...tender, starred: next })
      onChanged()
    }
  }

  async function handleSave() {
    if (!tender) return
    setSaving(true)
    const payload = {
      notes,
      items_notes: itemsNotes,
      payment_terms: paymentTerms,
      company,
      need_bank_guarantee: needBank,
      need_contract_security: needSecurity,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('tenders').update(payload).eq('id', tender.id)
    setSaving(false)
    if (error) {
      alert('Помилка збереження: ' + error.message)
      return
    }
    setTender({ ...tender, ...payload })
    onChanged()
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }

  async function handleDelete() {
    if (!tender) return
    if (!confirm(`Видалити тендер?\n\n${tender.title}`)) return
    const { error } = await supabase.from('tenders').delete().eq('id', tender.id)
    if (error) {
      alert('Помилка видалення: ' + error.message)
      return
    }
    onChanged()
    onClose()
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }}
        onClick={onClose}
      />
      <aside
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          height: '100%',
          background: 'var(--card)',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tender?.prozorro_id || 'Тендер'}
          </div>
          <button className="btn btn-sm" onClick={onClose} aria-label="Закрити">
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
            padding: '0 8px',
          }}
        >
          {(
            [
              ['overview', 'Огляд'],
              ['info', 'Інформація про тендер'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="btn btn-sm"
              onClick={() => setTab(key)}
              style={{
                border: 'none',
                borderRadius: 0,
                borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
                background: 'transparent',
                fontWeight: tab === key ? 600 : 400,
                color: tab === key ? 'var(--text)' : 'var(--muted)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {loading && <p style={{ color: 'var(--muted)' }}>Завантаження...</p>}
          {error && <p style={{ color: 'var(--red)' }}>{error}</p>}

          {tender && !loading && tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <button
                  type="button"
                  onClick={toggleStar}
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
                <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{tender.title}</div>
              </div>

              <div>
                <div style={labelStyle}>Номер</div>
                <div style={{ fontSize: 14 }}>{tender.prozorro_id || '—'}</div>
              </div>

              <div>
                <div style={labelStyle}>Замовник</div>
                <div style={{ fontSize: 14 }}>{tender.customer}</div>
              </div>

              <div>
                <div style={labelStyle}>Бюджет</div>
                <div style={{ fontSize: 14 }}>{formatMoney(tender.budget)}</div>
              </div>

              <div>
                <div style={labelStyle}>Строк подачі</div>
                <div style={{ fontSize: 14 }}>{formatDate(tender.deadline)}</div>
              </div>

              {tender.items && tender.items.length > 0 && (
                <div>
                  <div style={labelStyle}>Позиції</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                    {tender.items.map((item, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        {item.description}
                        {item.quantity != null && (
                          <span style={{ color: 'var(--muted)' }}>
                            {' '}
                            — {item.quantity}
                            {item.unit ? ` ${item.unit}` : ''}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <div style={labelStyle}>Мої нотатки до позицій</div>
                <textarea
                  value={itemsNotes}
                  onChange={(e) => setItemsNotes(e.target.value)}
                  rows={2}
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="Уточнення по позиціях, що саме готуємо..."
                />
              </div>

              <div>
                <div style={labelStyle}>Умови оплати</div>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  style={{ width: '100%' }}
                  placeholder="наприклад Відстрочка 30 календарних днів"
                />
              </div>

              <div>
                <div style={labelStyle}>Компанія (від кого подаємо)</div>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  style={{ width: '100%' }}
                  placeholder="Назва компанії"
                />
              </div>

              <div>
                <div style={labelStyle}>Банківська гарантія та забезпечення</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={needBank} onChange={(e) => setNeedBank(e.target.checked)} />
                  Потрібна банківська гарантія (тендер)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={needSecurity} onChange={(e) => setNeedSecurity(e.target.checked)} />
                  Потрібне забезпечення договору
                </label>
              </div>

              <div>
                <div style={labelStyle}>Примітки</div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="Загальні примітки..."
                />
              </div>

              <div>
                <div style={{ ...labelStyle, marginBottom: 8 }}>Статус роботи</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {STATUS_OPTIONS.filter((o) => o.value).map((o) => {
                    const active = tender.status === o.value
                    return (
                      <button
                        key={String(o.value)}
                        type="button"
                        className="btn btn-sm"
                        onClick={() => updateStatus(o.value)}
                        style={{
                          background: active ? 'var(--accent)' : 'var(--card)',
                          color: active ? '#fff' : 'var(--text)',
                          borderColor: active ? 'var(--accent)' : 'var(--border)',
                        }}
                      >
                        {o.label}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => updateStatus(null)}
                    style={{ background: !tender.status ? '#e5e7eb' : 'var(--card)' }}
                  >
                    —
                  </button>
                </div>
              </div>
            </div>
          )}

          {tender && !loading && tab === 'info' && (
            <div>
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
                Тут згодом буде вивантаження в Word.
              </p>
            </div>
          )}
        </div>

        {tender && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {tender.prozorro_url && (
              <a
                href={tender.prozorro_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
              >
                Прозорро ↗
              </a>
            )}
            <button
              className="btn btn-sm"
              style={{ color: 'var(--red)', borderColor: '#fecaca' }}
              onClick={handleDelete}
            >
              Видалити
            </button>
            <button
              className="btn btn-sm btn-primary"
              style={{ marginLeft: 'auto' }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Збереження...' : savedFlash ? 'Збережено ✓' : 'Зберегти'}
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
