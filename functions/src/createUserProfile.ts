import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const ALLOWED_ROLES = ['vendor', 'customer'] as const
type Role = typeof ALLOWED_ROLES[number]

export const createUserProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
  }
  const { role, displayName, lang = 'en', extra = {} } = data as {
    role: Role
    displayName: string
    lang?: string
    extra?: Record<string, unknown>
  }
  if (!ALLOWED_ROLES.includes(role)) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid role')
  }
  await admin.firestore().doc(`users/${context.auth.uid}`).set({
    role,
    displayName,
    email: context.auth.token.email ?? '',
    lang,
    ...extra,
  })
  return { success: true }
})
