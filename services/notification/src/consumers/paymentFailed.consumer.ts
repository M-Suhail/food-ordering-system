import { consumeEvent } from '@food/event-bus';
import {
  PaymentFailedV1Schema,
  type PaymentFailedV1
} from '@food/event-contracts';
import { getDb } from '../lib/mongo';
import { sendNotification } from '../notifications/sendNotification';

export async function registerPaymentFailedConsumer(channel: any) {
  await consumeEvent<PaymentFailedV1>(
    channel,
    'notification.payment_failed',
    PaymentFailedV1Schema,
    async (data) => {
      const db = getDb();
      const eventKey = `payment_failed_${data.orderId}`;

      const exists = await db
        .collection('processedEvents')
        .findOne({ eventKey });

      if (exists) return;

      await sendNotification('PAYMENT_FAILED', data);

      await db.collection('processedEvents').insertOne({
        eventKey,
        orderId: data.orderId,
        processedAt: new Date()
      });
    }
  );
}

