import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { XCircle } from 'lucide-react'

export default function CheckoutCancelPage() {
  const { t } = useTranslation()
  return (
    <div className="max-w-md mx-auto py-16 flex flex-col items-center gap-6 text-center">
      <p className="text-primary text-headline-lg-mobile font-bold">MysteryBox Fresh Food</p>

      <div className="relative w-full bg-surface-container rounded-xl border border-surface-container-highest overflow-hidden shadow-2xl p-8 flex flex-col items-center gap-6">
        {/* Error gradient top */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-error-token to-error-container" />

        {/* Error icon */}
        <div className="w-20 h-20 rounded-full bg-error-container/20 border border-error-token/30 flex items-center justify-center">
          <XCircle size={40} className="text-error-token" />
        </div>

        <div>
          <h1 className="text-headline-lg-mobile font-bold text-on-surface">{t('order.cancelled')}</h1>
          <p className="text-on-surface-variant text-body-lg mt-2">{t('order.cancelledMsg')}</p>
        </div>

        <Link to="/browse">
          <button className="border border-outline-variant hover:border-primary text-primary text-body-lg font-semibold rounded-lg px-8 py-3 transition-colors">
            {t('order.backToBrowse')}
          </button>
        </Link>
      </div>
    </div>
  )
}
