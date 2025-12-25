import { consumeEvent } from '@food/event-bus';
import {
  DeliveryAssignedV1Schema,
  type DeliveryAssignedV1
} from '@food/event-contracts';
import { getDb } from '../lib/mongo';
import { sendNotification } from '../notifications/sendNotification';
import { logger } from '../lib/logger';

export async function registerDeliveryAssignedConsumer(channel: any) {
  await consumeEvent<DeliveryAssignedV1>(
    channel,
    'notification.delivery_assigned',
    DeliveryAssignedV1Schema,
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = logger.child({ traceId });

      const db = getDb();
      const eventKey = `delivery_assigned_${data.orderId}`;

      const exists = await db
        .collection('processedEvents')
        .findOne({ eventKey });

      if (exists) return;

      await sendNotification('DELIVERY_ASSIGNED', data);

      await db.collection('processedEvents').insertOne({
        eventKey,
        orderId: data.orderId,
        processedAt: new Date()
      });
    }
  );
}

