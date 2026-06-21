import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const savePushToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required')
  const { fcmToken } = data as { fcmToken: string }
  if (!fcmToken) throw new functions.https.HttpsError('invalid-argument', 'fcmToken required')
  await admin.firestore().doc(`pushTokens/${context.auth.uid}`).set({
    fcmToken,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { ok: true }
})
