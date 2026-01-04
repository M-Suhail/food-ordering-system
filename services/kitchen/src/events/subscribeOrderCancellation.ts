/**
 * Kitchen Order Cancellation Consumer
 * Handles order.cancelled events and reverses kitchen assignment
 * Publishes kitchen.order.cancelled event for compensation
 */

import { Db } from 'mongodb';
import { Channel } from 'amqplib';
import { consumeEvent, publishEvent } from '@food/event-bus';
import {
  OrderCancelledV1Schema,
  type OrderCancelledV1
} from '@food/event-contracts';
import { logger as baseLogger } from '../lib/logger';

export async function subscribeOrderCancellation(
  mongoDb: Db,
  channel: Channel
) {
  const log = baseLogger.child({ context: 'subscribeOrderCancellation' });

  await consumeEvent<OrderCancelledV1>(
    channel,
    'kitchen_service.order_cancelled',
    OrderCancelledV1Schema,
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = baseLogger.child({ traceId, orderId: data.orderId });

      log.info('Received order.cancelled event');

      const processedEventsCollection = mongoDb.collection('processedEvents');

      // Check for duplicate processing (idempotency)
      const eventId = `cancelled-${data.orderId}`;
      const processed = await processedEventsCollection.findOne({
        eventId
      });

      if (processed) {
        log.info('order.cancelled already processed');
        return;
      }

      // Get the kitchen order to check if it exists
      const kitchenOrdersCollection = mongoDb.collection('kitchenOrders');
      const kitchenOrder = await kitchenOrdersCollection.findOne({
        orderId: data.orderId
      });

      if (!kitchenOrder) {
        log.warn('Kitchen order not found for cancellation');
        // Still mark as processed to avoid reprocessing
        await processedEventsCollection.insertOne({
          eventId,
          createdAt: new Date()
        });
        return;
      }

      // Mark the kitchen order as cancelled
      await kitchenOrdersCollection.updateOne(
        { orderId: data.orderId },
        {
          $set: {
            status: 'CANCELLED',
            cancelledAt: new Date(data.cancelledAt),
            reason: data.reason,
            updatedAt: new Date()
          }
        }
      );

      log.info('Kitchen order marked as cancelled');

      // Publish kitchen.order.cancelled event for delivery service compensation
      await publishEvent(
        channel,
        'kitchen_service.kitchen_order_cancelled',
        {
          eventId: `kitchen-cancelled-${data.orderId}`,
          eventType: 'kitchen.order.cancelled',
          eventVersion: 1,
          occurredAt: new Date().toISOString(),
          producer: 'kitchen-service',
          traceId,
          data: {
            orderId: data.orderId,
            reason: data.reason,
            cancelledAt: data.cancelledAt
          }
        }
      );

      log.info('Published kitchen.order.cancelled event');

      // Mark as processed
      await processedEventsCollection.insertOne({
        eventId,
        createdAt: new Date()
      });
    }
  );

  log.info('Subscribed to order.cancelled events');
}
