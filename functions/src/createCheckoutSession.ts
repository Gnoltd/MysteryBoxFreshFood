import * as functions from 'firebase-functions'

export const createCheckoutSession = functions.https.onCall(async (_data, _context) => {
  throw new functions.https.HttpsError('unimplemented', 'Not yet implemented')
})
