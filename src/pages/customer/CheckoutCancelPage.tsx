import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export default function CheckoutCancelPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-5xl mb-4">❌</div>
      <h2 className="text-white text-xl font-bold">{t('order.paymentCancelled')}</h2>
      <p className="text-slate-400 mt-2">{t('order.cancelledSub')}</p>
      <Link to="/browse" className="mt-6"><Button className="bg-indigo-600 hover:bg-indigo-500">{t('order.backToBrowse')}</Button></Link>
    </div>
  )
}
