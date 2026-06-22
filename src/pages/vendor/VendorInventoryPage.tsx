import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import {
  subscribeToInventory, addInventoryItem,
  updateInventoryItem, deleteInventoryItem
} from '../../services/inventory'
import { expiryLabel } from '../../utils/inventoryUtils'
import { StockProgressBar } from '../../components/shared/StockProgressBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import type { InventoryItem, ListingCategory } from '../../types'

const ALL_CATEGORIES: ListingCategory[] = [
  'bakery', 'fruit', 'vegetables', 'dairy', 'meat', 'drinks', 'other'
]

const CATEGORY_ICONS: Record<ListingCategory, string> = {
  bakery: '/images/icons/bakery.png',
  fruit: '/images/icons/fruit.png',
  vegetables: '/images/icons/vegetables.png',
  dairy: '/images/icons/dairy.png',
  meat: '/images/icons/meat.png',
  drinks: '/images/icons/drinks.png',
  other: '/images/icons/other.png',
}

interface FormState {
  name: string; category: ListingCategory; unitPrice: string
  unit: string; defaultQty: string; bestBefore: string
}

const EMPTY: FormState = {
  name: '', category: 'other', unitPrice: '', unit: 'piece', defaultQty: '1', bestBefore: ''
}

export default function VendorInventoryPage() {
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    return subscribeToInventory(currentUser.uid, data => {
      setItems(data); setLoading(false)
    })
  }, [currentUser])

  const openAdd = () => { setEditingId(null); setForm(EMPTY); setShowForm(true) }

  const openEdit = (item: InventoryItem) => {
    setEditingId(item.id)
    setForm({
      name: item.name, category: item.category,
      unitPrice: String(item.unitPrice), unit: item.unit,
      defaultQty: String(item.defaultQty),
      bestBefore: item.bestBefore
        ? new Date(item.bestBefore.seconds * 1000).toISOString().split('T')[0]
        : '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!currentUser || !form.name.trim() || !form.unitPrice) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        unitPrice: parseInt(form.unitPrice),
        unit: form.unit.trim() || 'piece',
        defaultQty: Math.max(1, parseInt(form.defaultQty) || 1),
        bestBefore: form.bestBefore
          ? Timestamp.fromDate(new Date(form.bestBefore))
          : null,
      }
      if (editingId) {
        await updateInventoryItem(currentUser.uid, editingId, payload)
      } else {
        await addInventoryItem(currentUser.uid, payload)
      }
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!currentUser || !confirm(t('vendor.delete') + '?')) return
    await deleteInventoryItem(currentUser.uid, id)
  }

  const sorted = [...items].sort((a, b) => {
    const aExp = expiryLabel(a) !== null
    const bExp = expiryLabel(b) !== null
    if (aExp !== bExp) return aExp ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const BADGE: Record<string, { style: string; label: string }> = {
    expired: { style: 'bg-surface-container text-on-surface-variant', label: t('vendor.expired') },
    today:   { style: 'bg-red-900 text-red-300',                      label: t('vendor.expires_today') },
    soon:    { style: 'bg-amber-900 text-amber-300',                   label: t('vendor.expires_soon') },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-on-surface">{t('vendor.inventory')}</h1>
        <Button onClick={openAdd} className="gradient-bg">
          + {t('vendor.add_item')}
        </Button>
      </div>

      {showForm && (
        <div className="bg-surface-container border border-primary rounded-xl p-5 mb-4 space-y-4">
          <h2 className="text-on-surface font-semibold">
            {editingId ? t('vendor.edit_item') : `+ ${t('vendor.add_item')}`}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-on-surface-variant text-sm mb-1 block">{t('vendor.item_name')}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" placeholder="e.g. Croissant" />
            </div>
            <div>
              <Label className="text-on-surface-variant text-sm mb-1 block">{t('vendor.category')}</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as ListingCategory }))}>
                <SelectTrigger className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface-container-high border-outline-variant">
                  {ALL_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="text-on-surface">
                      <span className="flex items-center gap-2">
                        <img src={CATEGORY_ICONS[c]} alt={c} className="w-5 h-5 object-contain" />
                        {t(`categories.${c}`)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-on-surface-variant text-sm mb-1 block">{t('vendor.item_price')} (VND)</Label>
              <Input value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))}
                type="number" min="1000" className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" placeholder="15000" />
            </div>
            <div>
              <Label className="text-on-surface-variant text-sm mb-1 block">{t('vendor.unit')}</Label>
              <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" placeholder="piece" />
            </div>
            <div>
              <Label className="text-on-surface-variant text-sm mb-1 block">{t('vendor.default_qty')}</Label>
              <Input value={form.defaultQty} onChange={e => setForm(f => ({ ...f, defaultQty: e.target.value }))}
                type="number" min="1" className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" />
            </div>
            <div className="col-span-2">
              <Label className="text-on-surface-variant text-sm mb-1 block">{t('vendor.best_before')} (optional)</Label>
              <Input value={form.bestBefore} onChange={e => setForm(f => ({ ...f, bestBefore: e.target.value }))}
                type="date" className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !form.name || !form.unitPrice}
              className="gradient-bg disabled:opacity-50">
              {saving ? t('vendor.saving') : t('vendor.save')}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-outline-variant text-on-surface-variant">
              {t('vendor.cancel')}
            </Button>
          </div>
        </div>
      )}

      {loading && <p className="text-on-surface-variant">{t('browse.loading')}</p>}

      {!loading && items.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="text-on-surface-variant text-lg mb-4">{t('vendor.no_inventory')}</p>
          <Button onClick={openAdd} className="gradient-bg">
            + {t('vendor.add_item')}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map(item => {
          const label = expiryLabel(item)
          return (
            <div key={item.id} className={`bg-surface-container border rounded-xl p-4 flex items-center gap-4 ${
              label === 'today' ? 'border-red-500/60' : label === 'soon' ? 'border-amber-500/60' : 'border-outline-variant'
            }`}>
              <img src={CATEGORY_ICONS[item.category]} alt={item.category} className="w-8 h-8 object-contain" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-on-surface font-medium">{item.name}</p>
                  {label && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[label].style}`}>
                      {BADGE[label].label}
                    </span>
                  )}
                </div>
                <p className="text-on-surface-variant text-sm">
                  {item.unitPrice.toLocaleString('vi-VN')} đ / {item.unit} · {t('vendor.default_qty')}: {item.defaultQty}
                </p>
                <div className="mt-1">
                  <StockProgressBar current={item.defaultQty} total={(item as InventoryItem & { maxQty?: number }).maxQty ?? 10} />
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(item)}
                  className="border-outline-variant text-on-surface-variant hover:text-on-surface">{t('vendor.edit')}</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                  {t('vendor.delete')}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
