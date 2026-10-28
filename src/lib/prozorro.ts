import type { TenderItem } from '../types/tender'

const API_BASE =
  typeof window !== 'undefined'
    ? '/api/prozorro'
    : 'https://public-api.prozorro.gov.ua/api/2.5'

export interface ProzorroTenderData {
  prozorro_id: string
  title: string
  customer: string
  budget: number | null
  currency: string
  deadline: string | null
  items: TenderItem[]
  prozorro_url: string
}

/** Витягує UA-номер або internal id з тексту / посилання */
function extractId(input: string): string {
  const text = input.trim()

  // Посилання prozorro.gov.ua/tender/UA-...
  const uaFromUrl = text.match(/UA-\d{4}-\d{2}-\d{2}-\d{6}-[a-z0-9]+/i)
  if (uaFromUrl) return uaFromUrl[0]

  // Internal id у посиланні .../tenders/xxxxxxxx
  const uuidFromUrl = text.match(/tenders\/([a-f0-9]{32})/i)
  if (uuidFromUrl) return uuidFromUrl[1]

  // Просто 32-символьний id
  if (/^[a-f0-9]{32}$/i.test(text)) return text

  return text
}

async function resolveInternalId(tenderID: string): Promise<string | null> {
  let offset: string | null = null
  const maxPages = 15

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      limit: '100',
      descending: '1',
      opt_fields: 'id,tenderID',
    })
    if (offset) params.set('offset', offset)

    const res = await fetch(`${API_BASE}/tenders?${params}`)
    if (!res.ok) throw new Error(`Prozorro API error: ${res.status}`)

    const data = await res.json()
    const found = (data.data || []).find((t: any) => t.tenderID === tenderID)
    if (found) return found.id

    if (!data.next_page?.offset) break
    offset = data.next_page.offset
  }

  return null
}

export async function fetchProzorroTender(
  tenderId: string
): Promise<ProzorroTenderData> {
  const cleanId = extractId(tenderId)
  let internalId = cleanId

  if (/^UA-\d{4}/i.test(cleanId)) {
    const resolved = await resolveInternalId(cleanId)
    if (!resolved) {
      throw new Error(
        'Не знайдено серед нещодавно змінених тендерів. Вставте внутрішній ID (32 символи) з Network у браузері або свіжіший номер.'
      )
    }
    internalId = resolved
  }

  const res = await fetch(`${API_BASE}/tenders/${internalId}`)
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Тендер не знайдено в Прозорро. Перевірте номер або ID.')
    }
    throw new Error(`Prozorro API error: ${res.status}`)
  }

  const full = await res.json()
  const t = full.data

  const items: TenderItem[] = (t.items || []).map((item: any) => ({
    description: item.description || item.title || '',
    quantity: item.quantity ?? null,
    unit: item.unit?.name || item.unit?.code || null,
    amount: item.unit?.value?.amount ?? null,
  }))

  const value = t.value || t.lots?.[0]?.value

  return {
    prozorro_id: t.tenderID || cleanId,
    title: t.title || t.title_en || 'Без назви',
    customer:
      t.procuringEntity?.name ||
      t.procuringEntity?.identifier?.legalName ||
      '—',
    budget: value?.amount ?? null,
    currency: value?.currency || 'UAH',
    deadline: t.tenderPeriod?.endDate || t.enquiryPeriod?.endDate || null,
    items,
    prozorro_url: `https://prozorro.gov.ua/tender/${t.tenderID || internalId}`,
  }
}
