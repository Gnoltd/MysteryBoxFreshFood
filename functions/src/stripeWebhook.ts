import * as functions from 'firebase-functions'

export const stripeWebhook = functions.https.onRequest(async (_req, res) => {
  res.status(501).send('Not yet implemented')
})
