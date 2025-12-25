import { consumeEvent } from '@food/event-bus';
import {
  KitchenAcceptedV1Schema,
  type KitchenAcceptedV1
} from '@food/event-contracts';
import { getDb } from '../lib/mongo';
import { sendNotification } from '../notifications/sendNotification';
import { logger } from '../lib/logger';

export async function registerKitchenAcceptedConsumer(channel: any) {
  await consumeEvent<KitchenAcceptedV1>(
    channel,
    'notification.kitchen_accepted',
    KitchenAcceptedV1Schema,
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = logger.child({ traceId });
      
      const db = getDb();
      const eventKey = `kitchen_accepted_${data.orderId}`;

      const exists = await db
        .collection('processedEvents')
        .findOne({ eventKey });

      if (exists) return;

      await sendNotification('KITCHEN_ACCEPTED', data);

      await db.collection('processedEvents').insertOne({
        eventKey,
        orderId: data.orderId,
        processedAt: new Date()
      });
    }
  );
}

