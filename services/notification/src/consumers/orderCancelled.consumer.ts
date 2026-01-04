/**
 * Order Cancellation Notification Consumer
 * Notifies user when their order has been cancelled
 */

import { Db } from 'mongodb';
import { Channel } from 'amqplib';
import { consumeEvent } from '@food/event-bus';
import {
  OrderCancelledV1Schema,
  type OrderCancelledV1
} from '@food/event-contracts';
import { sendNotification } from '../notifications/sendNotification';
import { logger } from '../lib/logger';

export async function subscribeOrderCancelled(
  mongoDb: Db,
  channel: Channel
) {
  const log = logger.child({ context: 'subscribeOrderCancelled' });

  await consumeEvent<OrderCancelledV1>(
    channel,
    'notification_service.order_cancelled',
    OrderCancelledV1Schema,
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = logger.child({ traceId, orderId: data.orderId });

      log.info('Received order.cancelled event');

      const notificationsCollection = mongoDb.collection('notifications');

      // Idempotency
      const eventId = `cancelled-${data.orderId}`;
      const processed = await notificationsCollection.findOne({
        eventId
      });

      if (processed) {
        log.info('Cancellation notification already sent');
        return;
      }

      // Send cancellation notification
      await sendNotification(
        `Order ${data.orderId} has been cancelled`,
        `Reason: ${data.reason.replace(/_/g, ' ')}.${
          data.refundAmount ? ` Amount refunded: $${data.refundAmount}` : ''
        }`
      );

      // Persist notification record
      await notificationsCollection.insertOne({
        eventId,
        orderId: data.orderId,
        type: 'ORDER_CANCELLED',
        message: `Order cancelled: ${data.reason}`,
        refundAmount: data.refundAmount,
        createdAt: new Date()
      });

      log.info('Cancellation notification sent');
    }
  );

  log.info('Subscribed to order.cancelled events');
}
