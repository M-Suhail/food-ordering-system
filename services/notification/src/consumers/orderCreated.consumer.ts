import { consumeEvent } from '@food/event-bus';
import {
  OrderCreatedV1Schema,
  type OrderCreatedV1
} from '@food/event-contracts';
import { getDb } from '../lib/mongo';
import { sendNotification } from '../notifications/sendNotification';
import { logger } from '../lib/logger';

export async function registerOrderCreatedConsumer(channel: any) {
  await consumeEvent<OrderCreatedV1>(
    channel,
    'notification.order_created',
    OrderCreatedV1Schema,
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = logger.child({ traceId });
      
      const db = getDb();
      const eventKey = `order_created_${data.orderId}`;

      const exists = await db
        .collection('processedEvents')
        .findOne({ eventKey });

      if (exists) return;

      await sendNotification('ORDER_CREATED', data);

      await db.collection('processedEvents').insertOne({
        eventKey,
        orderId: data.orderId,
        processedAt: new Date()
      });
    }
  );
}

