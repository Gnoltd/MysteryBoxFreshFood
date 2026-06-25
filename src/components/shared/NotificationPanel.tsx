import { useEffect, useState } from 'react'
import { X, Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { getNotifications, markAllRead } from '../../services/notifications'
import type { NotificationItem } from '../../types'
import { useNavigate } from 'react-router-dom'

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const [items, setItems] = useState<NotificationItem[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!open || !userProfile) return
    getNotifications(userProfile.uid).then(setItems)
  }, [open, userProfile])

  const handleMarkAll = async () => {
    if (!userProfile) return
    await markAllRead(userProfile.uid)
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleItem = (item: NotificationItem) => {
    navigate(`/listing/${item.listingId}`)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative w-full max-w-sm bg-surface-container border-l border-outline-variant h-full overflow-y-auto flex flex-col z-10">
        <div className="flex items-center justify-between p-4 border-b border-outline-variant">
          <div className="flex items-center gap-2 text-on-surface font-semibold">
            <Bell size={18} />
            {t('notif.title')}
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-on-surface-variant text-body-sm">
            {t('notif.empty')}
          </div>
        ) : (
          <>
            <button onClick={handleMarkAll} className="text-primary text-body-sm px-4 py-2 text-left hover:underline">
              {t('notif.markAllRead')}
            </button>
            <ul className="flex-1">
              {items.map(item => (
                <li
                  key={item.id}
                  onClick={() => handleItem(item)}
                  className={`px-4 py-3 border-b border-outline-variant cursor-pointer hover:bg-surface-container-high transition-colors ${!item.read ? 'bg-primary/5' : ''}`}
                >
                  <p className={`text-body-sm ${!item.read ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>{item.title}</p>
                  <p className="text-xs text-outline mt-0.5">{item.body}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </div>
  )
}
