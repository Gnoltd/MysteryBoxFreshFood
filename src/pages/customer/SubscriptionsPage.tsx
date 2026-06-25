import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getFollows, unfollowVendor, toggleNotifications } from '../../services/follows'
import { subscribeToSubscription, createSubscription, cancelSubscription, syncSubscription } from '../../services/subscriptions'
import { getUserProfile } from '../../services/auth'
import { GradientButton } from '../../components/shared/GradientButton'
import { GhostButton } from '../../components/shared/GhostButton'
import { StatusChip } from '../../components/shared/StatusChip'
import type { Follow, Subscription, SubscriptionPlan } from '../../types'
import { Bell, BellOff, Trash2, Leaf, Users, Sparkles } from 'lucide-react'

const WHY_ITEMS = [
  { icon: Leaf,     titleKey: 'subs.whySustainTitle',  descKey: 'subs.whySustainDesc' },
  { icon: Users,    titleKey: 'subs.whyLocalTitle',    descKey: 'subs.whyLocalDesc' },
  { icon: Sparkles, titleKey: 'subs.whyFreshTitle',    descKey: 'subs.whyFreshDesc' },
]

export default function SubscriptionsPage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [follows, setFollows] = useState<Follow[]>([])
  const [vendorNames, setVendorNames] = useState<Record<string, string>>({})
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [subError, setSubError] = useState<string | null>(null)
  const subResult = searchParams.get('sub')
  const stripeSessionId = searchParams.get('session_id') ?? undefined

  const PLANS = [
    {
      key: 'free' as SubscriptionPlan,
      displayName: 'Basic',
      price: t('subs.planFreeName'),
      limitPerDay: 2,
      features: ['subs.featureFollow', 'subs.featureNotify'],
    },
    {
      key: 'weekly' as SubscriptionPlan,
      displayName: 'Pro',
      price: `150.000 đ ${t('subs.perMonth')}`,
      limitPerDay: 5,
      popular: true,
      features: ['subs.featureFollow', 'subs.featureNotify', 'subs.featurePriority', 'subs.featureWeekly'],
    },
    {
      key: 'monthly' as SubscriptionPlan,
      displayName: 'Elite',
      price: `300.000 đ ${t('subs.perMonth')}`,
      limitPerDay: 8,
      features: ['subs.featureFollow', 'subs.featureNotify', 'subs.featurePriority', 'subs.featureWeekly', 'subs.featureVoucher'],
    },
  ]

  useEffect(() => {
    if (!userProfile) return
    getFollows(userProfile.uid).then(async follows => {
      setFollows(follows)
      const names: Record<string, string> = {}
      await Promise.all(
        follows.map(async f => {
          const profile = await getUserProfile(f.vendorId)
          names[f.vendorId] = profile?.storeName ?? f.vendorId
        })
      )
      setVendorNames(names)
    })
    const unsub = subscribeToSubscription(userProfile.uid, setSubscription)
    return unsub
  }, [userProfile])

  // When returning from Stripe checkout success, sync subscription from Stripe directly.
  // Uses the session ID for a direct lookup — reliable even before the webhook fires.
  useEffect(() => {
    if (subResult !== 'success' || !userProfile) return

    let cancelled = false
    const attempt = async (delayMs: number) => {
      await new Promise(r => setTimeout(r, delayMs))
      if (cancelled) return
      try {
        const result = await syncSubscription(stripeSessionId)
        if (!result.synced && !cancelled) {
          // Retry once more after 3s if Stripe hasn't processed yet
          await new Promise(r => setTimeout(r, 3000))
          if (!cancelled) await syncSubscription(stripeSessionId)
        }
      } catch (err) {
        console.error('syncSubscription failed:', err)
      }
    }
    attempt(1000)
    return () => { cancelled = true }
  }, [subResult, userProfile, stripeSessionId])

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
    setSubError(null)
    try {
      const { url } = await createSubscription(plan)
      if (!url) throw new Error('No checkout URL returned')
      window.location.href = url
    } catch (e: any) {
      console.error(e)
      setSubError(e?.message ?? 'Subscription failed — please try again')
      setLoadingPlan(null)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    setSubError(null)
    try {
      await cancelSubscription()
      setSubscription(null)
    } catch (e: any) {
      setSubError(e?.message ?? 'Cancel failed — please try again')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div>
      {/* Success / cancelled banner */}
      {subResult && (
        <div className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between ${
          subResult === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            : 'bg-surface-container border border-outline-variant text-on-surface-variant'
        }`}>
          <span>{subResult === 'success' ? t('subs.subSuccess') : t('subs.subCancelled')}</span>
          <button onClick={() => setSearchParams({})} className="ml-4 hover:opacity-70 transition-opacity">✕</button>
        </div>
      )}

      {/* Hero section */}
      <section className="relative bg-surface-container border border-outline-variant rounded-2xl overflow-hidden mb-12 px-8 py-12 md:py-16">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="blob w-64 h-64 bg-inverse-primary/10 top-0 left-0" />
          <div className="blob w-48 h-48 bg-secondary-container/10 bottom-0 right-0" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-4 max-w-lg">
            <span className="inline-flex items-center gap-2 bg-surface-variant border border-outline-variant rounded-full px-4 py-1.5 text-label-caps text-on-surface uppercase tracking-wider w-fit">
              ★ {t('subs.vipAccess')}
            </span>
            <h1 className="text-headline-lg font-bold text-on-surface">
              {t('subs.elevate')}{' '}
              <span className="gradient-text">{t('subs.experience')}</span>
            </h1>
            <p className="text-on-surface-variant text-body-lg">{t('subs.heroSubtitle')}</p>
            <button className="gradient-bg text-white rounded-lg px-6 py-3 font-semibold text-body-lg hover:opacity-90 transition-opacity w-fit">
              {t('subs.explorePlans')} →
            </button>
          </div>
          <img
            src="/Design/a_modern_vibrant_3d_illustration_for_a_food_subscription_service._features_a/screen.png"
            alt="Subscription box"
            className="w-48 h-48 md:w-64 md:h-64 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      </section>

      {/* Plan cards */}
      <section className="mb-12">
        {subError && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30">
            {subError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(({ key, displayName, price, popular, features, limitPerDay }) => {
            const isActive = subscription?.plan === key && subscription?.status === 'active'
            const hasActivePaidSub = subscription?.status === 'active' && subscription?.plan !== 'free'
            const isCurrentFree = key === 'free' && !hasActivePaidSub
            return (
              <div
                key={key}
                className={`relative bg-surface-container border rounded-xl p-5 flex flex-col gap-4 ${
                  popular && !isActive ? 'border-primary gradient-border-box' : isActive ? 'gradient-border-box border-primary' : 'border-outline-variant'
                }`}
              >
                {popular && !isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="gradient-bg text-white text-label-caps font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      {t('subs.mostPopular').toUpperCase()}
                    </span>
                  </div>
                )}
                {isActive && (
                  <StatusChip variant="emerald">{t('subs.active')}</StatusChip>
                )}
                <div>
                  <h3 className="text-headline-md font-bold text-on-surface">{displayName}</h3>
                  <p className="text-primary font-bold text-mono-stat mt-1">{price}</p>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  <li className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                    <span className="text-emerald-400">✓</span>
                    {t('subs.dailyLimit', { n: limitPerDay })}
                  </li>
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
                ) : isCurrentFree ? (
                  <GhostButton className="w-full" disabled>{t('subs.currentFree')}</GhostButton>
                ) : key === 'free' ? null : (
                  <GradientButton
                    onClick={() => handleSubscribe(key)}
                    disabled={loadingPlan === key}
                    className="w-full"
                  >
                    {loadingPlan === key ? t('subs.subscribing') : `${t('subs.upgrade')} ${displayName}`}
                  </GradientButton>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Why Subscribe */}
      <section className="mb-12">
        <h2 className="text-headline-md font-bold text-on-surface text-center mb-6">{t('subs.whyTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WHY_ITEMS.map(({ icon: Icon, titleKey, descKey }) => (
            <div key={titleKey} className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col gap-3">
              <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="text-on-surface font-semibold text-body-lg">{t(titleKey)}</h3>
              <p className="text-on-surface-variant text-body-sm">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Followed Vendors */}
      {follows.length > 0 && (
        <section>
          <h2 className="text-headline-md font-bold text-on-surface mb-4">{t('subs.followedVendors')}</h2>
          <div className="flex flex-col gap-3">
            {follows.map(follow => (
              <div key={follow.id} className="bg-surface-container border border-outline-variant rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
                  {follow.vendorId.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface font-semibold text-body-sm truncate">
                    {vendorNames[follow.vendorId] ?? follow.vendorId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleNotif(follow)}
                    className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface"
                    title={follow.notificationsEnabled ? t('subs.muteNotif') : t('subs.enableNotif')}>
                    {follow.notificationsEnabled ? <Bell size={18} className="text-primary" /> : <BellOff size={18} />}
                  </button>
                  <button onClick={() => handleUnfollow(follow)}
                    className="p-2 rounded-lg hover:bg-error-container/20 transition-colors text-on-surface-variant hover:text-error-token">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
