import { getMessaging, getToken } from 'firebase/messaging'
import { app, functions } from '../firebase'
import { httpsCallable } from 'firebase/functions'

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function savePushToken(): Promise<void> {
  const granted = await requestPermission()
  if (!granted) return
  const messaging = getMessaging(app)
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string
  if (!vapidKey) return
  const swReg = await navigator.serviceWorker.ready
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg })
  if (!token) return
  const saveFn = httpsCallable(functions, 'savePushToken')
  await saveFn({ fcmToken: token })
}
