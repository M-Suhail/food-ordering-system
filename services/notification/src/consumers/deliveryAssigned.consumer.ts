import { consumeEvent } from '@food/event-bus';
import { Channel } from 'amqplib';
import {
  DeliveryAssignedV1Schema,
  type DeliveryAssignedV1
} from '@food/event-contracts';
import { getDb } from '../lib/mongo';
import { sendNotification } from '../notifications/sendNotification';

export async function registerDeliveryAssignedConsumer(channel: Channel) {
  await consumeEvent<DeliveryAssignedV1>(
    channel,
    'notification.delivery_assigned',
    DeliveryAssignedV1Schema,
    async (data) => {

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

