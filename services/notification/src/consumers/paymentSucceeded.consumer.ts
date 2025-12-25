import { consumeEvent } from '@food/event-bus';
import {
  PaymentSucceededV1Schema,
  type PaymentSucceededV1
} from '@food/event-contracts';
import { getDb } from '../lib/mongo';
import { sendNotification } from '../notifications/sendNotification';
import { logger } from '../lib/logger';

export async function registerPaymentSucceededConsumer(channel: any) {
  await consumeEvent<PaymentSucceededV1>(
    channel,
    'notification.payment_succeeded',
    PaymentSucceededV1Schema,
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = logger.child({ traceId });
      
      const db = getDb();
      const eventKey = `payment_succeeded_${data.orderId}`;

      const exists = await db
        .collection('processedEvents')
        .findOne({ eventKey });

      if (exists) return;

      await sendNotification('PAYMENT_SUCCEEDED', data);

      await db.collection('processedEvents').insertOne({
        eventKey,
        orderId: data.orderId,
        processedAt: new Date()
      });
    }
  );
}
