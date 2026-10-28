export type TenderStatus =
  | 'interesting'
  | 'preparing'
  | 'submitted'
  | 'won'
  | 'lost'
  | 'archive'
  | null

export interface TenderItem {
  description: string
  quantity?: number | null
  unit?: string | null
  amount?: number | null
}

export interface Tender {
  id: string
  prozorro_id: string | null
  title: string
  customer: string
  budget: number | null
  currency: string
  deadline: string | null
  status: TenderStatus
  items: TenderItem[]
  notes: string
  items_notes: string
  payment_terms: string
  company: string
  need_bank_guarantee: boolean
  need_contract_security: boolean
  prozorro_url: string | null
  starred: boolean
  created_at: string
  updated_at: string
  source: 'prozorro' | 'manual'
}

export const STATUS_LABELS: Record<string, string> = {
  interesting: 'Цікаво',
  preparing: 'Готуємо',
  submitted: 'Подали',
  won: 'Виграли',
  lost: 'Програли',
  archive: 'Архів',
}

export const STATUS_OPTIONS: { value: TenderStatus; label: string }[] = [
  { value: null, label: '—' },
  { value: 'interesting', label: 'Цікаво' },
  { value: 'preparing', label: 'Готуємо' },
  { value: 'submitted', label: 'Подали' },
  { value: 'won', label: 'Виграли' },
  { value: 'lost', label: 'Програли' },
  { value: 'archive', label: 'Архів' },
]
