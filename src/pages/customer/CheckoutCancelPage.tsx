import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GradientButton } from '../../components/shared/GradientButton'
import { XCircle } from 'lucide-react'

export default function CheckoutCancelPage() {
  const { t } = useTranslation()
  return (
    <div className="max-w-md mx-auto py-16 flex flex-col items-center gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-error-container/20 border border-error-token/30 flex items-center justify-center">
        <XCircle size={40} className="text-error-token" />
      </div>
      <h1 className="text-headline-lg-mobile font-bold text-on-surface">{t('order.cancelled')}</h1>
      <p className="text-on-surface-variant text-body-lg">{t('order.cancelledMsg')}</p>
      <Link to="/browse"><GradientButton>{t('browse.title')}</GradientButton></Link>
    </div>
  )
}
