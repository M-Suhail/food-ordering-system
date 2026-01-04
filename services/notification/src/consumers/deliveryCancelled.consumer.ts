/**
 * Delivery Cancellation Notification Consumer
 * Notifies about delivery cancellations/delays
 */

import { Db } from 'mongodb';
import { Channel } from 'amqplib';
import { consumeEvent } from '@food/event-bus';
import {
  DeliveryCancelledV1Schema,
  type DeliveryCancelledV1
} from '@food/event-contracts';
import { sendNotification } from '../notifications/sendNotification';
import { logger } from '../lib/logger';

export async function subscribeDeliveryCancelled(
  mongoDb: Db,
  channel: Channel
) {
  const log = logger.child({ context: 'subscribeDeliveryCancelled' });

  await consumeEvent<DeliveryCancelledV1>(
    channel,
    'notification_service.delivery_cancelled',
    DeliveryCancelledV1Schema,
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = logger.child({ traceId, orderId: data.orderId });

      log.info('Received delivery.cancelled event');

      const notificationsCollection = mongoDb.collection('notifications');

      // Idempotency
      const eventId = `delivery-cancel-${data.orderId}`;
      const processed = await notificationsCollection.findOne({
        eventId
      });

      if (processed) {
        log.info('Delivery cancellation notification already sent');
        return;
      }

      // Send notification
      await sendNotification(
        `Delivery Cancelled for Order ${data.orderId}`,
        `Your delivery has been cancelled. Reason: ${data.reason.replace(
          /_/g,
          ' '
        )}`
      );

      // Persist notification record
      await notificationsCollection.insertOne({
        eventId,
        orderId: data.orderId,
        driverId: data.driverId,
        type: 'DELIVERY_CANCELLED',
        reason: data.reason,
        createdAt: new Date()
      });

      log.info('Delivery cancellation notification sent');
    }
  );

  log.info('Subscribed to delivery.cancelled events');
}
