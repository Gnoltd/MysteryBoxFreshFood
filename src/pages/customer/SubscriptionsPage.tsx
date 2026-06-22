import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { getFollows, unfollowVendor, toggleNotifications } from '../../services/follows'
import { getSubscription, createSubscription, cancelSubscription } from '../../services/subscriptions'
import { GradientButton } from '../../components/shared/GradientButton'
import { GhostButton } from '../../components/shared/GhostButton'
import { StatusChip } from '../../components/shared/StatusChip'
import type { Follow, Subscription, SubscriptionPlan } from '../../types'
import { Bell, BellOff, Trash2 } from 'lucide-react'

export default function SubscriptionsPage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const [follows, setFollows] = useState<Follow[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!userProfile) return
    getFollows(userProfile.uid).then(setFollows)
    getSubscription(userProfile.uid).then(setSubscription)
  }, [userProfile])

  const handleToggleNotif = async (follow: Follow) => {
    await toggleNotifications(follow.id, !follow.notificationsEnabled)
    setFollows(prev => prev.map(f => f.id === follow.id ? { ...f, notificationsEnabled: !f.notificationsEnabled } : f))
  }

  const handleUnfollow = async (follow: Follow) => {
    await unfollowVendor(follow.id)
    setFollows(prev => prev.filter(f => f.id !== follow.id))
  }

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan === 'free') return
    setLoadingPlan(plan)
    try {
      const { clientSecret } = await createSubscription(plan)
      console.log('Stripe clientSecret:', clientSecret)
      alert(t('subs.stripeRedirect'))
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleCancel = async () => {
    if (!subscription?.stripeSubscriptionId) return
    setCancelling(true)
    try {
      await cancelSubscription(subscription.stripeSubscriptionId)
      setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : null)
    } finally {
      setCancelling(false)
    }
  }

  const priceMap: Record<SubscriptionPlan, string> = {
    free:    t('subs.planFreePrice'),
    weekly:  '49.000 đ / tuần',
    monthly: '179.000 đ / tháng',
  }

  const PLANS: Array<{ key: SubscriptionPlan; features: string[] }> = [
    { key: 'free',    features: ['subs.featureFollow', 'subs.featureNotify'] },
    { key: 'weekly',  features: ['subs.featureFollow', 'subs.featureNotify', 'subs.featurePriority', 'subs.featureWeekly'] },
    { key: 'monthly', features: ['subs.featureFollow', 'subs.featureNotify', 'subs.featurePriority', 'subs.featureWeekly', 'subs.featureVoucher'] },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Section A: Followed Vendors */}
      <section className="mb-12">
        <h2 className="text-headline-md font-bold text-on-surface mb-4">{t('subs.followedVendors')}</h2>
        {follows.length === 0 ? (
          <div className="bg-surface-container border border-outline-variant rounded-xl p-8 text-center">
            <p className="text-on-surface-variant text-body-lg">{t('subs.noFollows')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {follows.map(follow => (
              <div
                key={follow.id}
                className="bg-surface-container border border-outline-variant rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
                  {follow.vendorId.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface font-semibold text-body-sm truncate">{follow.vendorId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleNotif(follow)}
                    className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface"
                    title={follow.notificationsEnabled ? t('subs.muteNotif') : t('subs.enableNotif')}
                  >
                    {follow.notificationsEnabled ? <Bell size={18} className="text-primary" /> : <BellOff size={18} />}
                  </button>
                  <button
                    onClick={() => handleUnfollow(follow)}
                    className="p-2 rounded-lg hover:bg-error-container/20 transition-colors text-on-surface-variant hover:text-error-token"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section B: Plans */}
      <section>
        {/* Hero */}
        <div className="mb-8 flex flex-col items-center text-center gap-3">
          <span className="inline-flex items-center gap-2 bg-surface-variant border border-outline-variant rounded-full px-4 py-1.5 text-label-caps text-on-surface uppercase tracking-wider">
            ★ {t('subs.vipAccess')}
          </span>
          <h2 className="text-headline-lg-mobile md:text-headline-lg font-bold">
            {t('subs.elevate')}{' '}
            <span className="gradient-text">{t('subs.experience')}</span>
          </h2>
          <p className="text-on-surface-variant text-body-lg max-w-md">{t('subs.heroSubtitle')}</p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(({ key, features }) => {
            const isActive = subscription?.plan === key && subscription?.status === 'active'
            return (
              <div
                key={key}
                className={`bg-surface-container border rounded-xl p-5 flex flex-col gap-4 ${isActive ? 'gradient-border-box' : 'border-outline-variant'}`}
              >
                {isActive && (
                  <StatusChip variant="emerald">{t('subs.active')}</StatusChip>
                )}
                <div>
                  <h3 className="text-headline-md font-bold text-on-surface capitalize">{t(`subs.plan_${key}`)}</h3>
                  <p className="text-primary font-bold text-mono-stat mt-1">{priceMap[key]}</p>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                      <span className="text-emerald-400">✓</span>
                      {t(f)}
                    </li>
                  ))}
                </ul>
                {isActive ? (
                  <div className="flex flex-col gap-2">
                    {subscription?.currentPeriodEnd && (
                      <p className="text-xs text-on-surface-variant">
                        {t('subs.renewsOn')} {new Date(subscription.currentPeriodEnd.seconds * 1000).toLocaleDateString()}
                      </p>
                    )}
                    <GhostButton onClick={handleCancel} disabled={cancelling} className="w-full">
                      {cancelling ? t('subs.cancelling') : t('subs.cancel')}
                    </GhostButton>
                  </div>
                ) : key === 'free' ? (
                  <GhostButton className="w-full" disabled>{t('subs.currentFree')}</GhostButton>
                ) : (
                  <GradientButton
                    onClick={() => handleSubscribe(key)}
                    disabled={loadingPlan === key}
                    className="w-full"
                  >
                    {loadingPlan === key ? t('subs.subscribing') : t('subs.subscribe')}
                  </GradientButton>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
