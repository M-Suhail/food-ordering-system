import { consumeEvent } from '@food/event-bus';
import {
  KitchenRejectedV1Schema,
  type KitchenRejectedV1
} from '@food/event-contracts';
import { getDb } from '../lib/mongo';
import { sendNotification } from '../notifications/sendNotification';

export async function registerKitchenRejectedConsumer(channel: any) {
  await consumeEvent<KitchenRejectedV1>(
    channel,
    'notification.kitchen_rejected',
    KitchenRejectedV1Schema,
    async (data) => {
      const db = getDb();
      const eventKey = `kitchen_rejected_${data.orderId}`;

      const exists = await db
        .collection('processedEvents')
        .findOne({ eventKey });

      if (exists) return;

      await sendNotification('KITCHEN_REJECTED', data);

      await db.collection('processedEvents').insertOne({
        eventKey,
        orderId: data.orderId,
        processedAt: new Date()
      });
    }
  );
}
