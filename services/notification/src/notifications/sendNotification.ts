import { getDb } from '../lib/mongo';

export async function sendNotification(
  type: string,
  payload: unknown
) {
  const db = getDb();

  await db.collection('notifications').insertOne({
    type,
    payload,
    sentAt: new Date()
  });

  // Stub: email/SMS provider later
  console.log(`[notification] ${type}`, payload);
}
