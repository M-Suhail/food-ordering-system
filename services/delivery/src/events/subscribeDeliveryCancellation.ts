/**
 * Delivery Cancellation Consumer
 * Handles order.cancelled and kitchen.order.cancelled events
 * Releases driver assignment and marks delivery as cancelled
 */

import { Db } from 'mongodb';
import { Channel } from 'amqplib';
import { consumeEvent, publishEvent } from '@food/event-bus';
import {
  OrderCancelledV1Schema,
  KitchenOrderCancelledV1Schema,
  type OrderCancelledV1,
  type KitchenOrderCancelledV1
} from '@food/event-contracts';
import { logger as baseLogger } from '../lib/logger';

export async function subscribeDeliveryCancellation(
  mongoDb: Db,
  channel: Channel
) {
  const log = baseLogger.child({ context: 'subscribeDeliveryCancellation' });

  /**
   * Handle kitchen.order.cancelled -> Release driver
   */
  await consumeEvent<KitchenOrderCancelledV1>(
    channel,
    'delivery_service.kitchen_order_cancelled',
    KitchenOrderCancelledV1Schema,
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = baseLogger.child({ traceId, orderId: data.orderId });

      log.info('Received kitchen.order.cancelled event');

      const processedEventsCollection = mongoDb.collection('processedEvents');

      // Idempotency
      const eventId = `delivery-cancel-${data.orderId}`;
      const processed = await processedEventsCollection.findOne({
        eventId
      });

      if (processed) {
        log.info('kitchen.order.cancelled already processed for delivery');
        return;
      }

      // Get the delivery assignment
      const deliveriesCollection = mongoDb.collection('deliveries');
      const delivery = await deliveriesCollection.findOne({
        orderId: data.orderId
      });

      if (!delivery) {
        log.warn('Delivery not found for cancellation');
        // Mark as processed
        await processedEventsCollection.insertOne({
          eventId,
          createdAt: new Date()
        });
        return;
      }

      // Mark delivery as cancelled
      await deliveriesCollection.updateOne(
        { orderId: data.orderId },
        {
          $set: {
            status: 'CANCELLED',
            cancelledAt: new Date(data.cancelledAt),
            reason: data.reason,
            releasedDriverId: delivery.driverId,
            updatedAt: new Date()
          }
        }
      );

      log.info('Delivery marked as cancelled', { driverId: delivery.driverId });

      // Publish delivery.cancelled event for notification
      await publishEvent(
        channel,
        'delivery_service.delivery_cancelled',
        {
          eventId: `delivery-cancelled-kitchen-${data.orderId}`,
          eventType: 'delivery.cancelled',
          eventVersion: 1,
          occurredAt: new Date().toISOString(),
          producer: 'delivery-service',
          traceId,
          data: {
            orderId: data.orderId,
            driverId: delivery.driverId,
            reason: data.reason,
            cancelledAt: data.cancelledAt
          }
        }
      );

      // Mark as processed
      await processedEventsCollection.insertOne({
        eventId,
        createdAt: new Date()
      });

      log.info('Published delivery.cancelled event');
    }
  );

  /**
   * Handle order.cancelled -> Release driver (fallback if kitchen event doesn't arrive)
   */
  await consumeEvent<OrderCancelledV1>(
    channel,
    'delivery_service.order_cancelled_direct',
    OrderCancelledV1Schema,
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = baseLogger.child({ traceId, orderId: data.orderId });

      log.info('Received order.cancelled event (direct from order service)');

      const processedEventsCollection = mongoDb.collection('processedEvents');

      // Idempotency (different key from kitchen event)
      const eventId = `delivery-direct-cancel-${data.orderId}`;
      const processed = await processedEventsCollection.findOne({
        eventId
      });

      if (processed) {
        log.info('order.cancelled already processed for delivery');
        return;
      }

      // Get the delivery assignment
      const deliveriesCollection = mongoDb.collection('deliveries');
      const delivery = await deliveriesCollection.findOne({
        orderId: data.orderId
      });

      if (!delivery) {
        log.warn('Delivery not found, skipping cancellation');
        // Mark as processed
        await processedEventsCollection.insertOne({
          eventId,
          createdAt: new Date()
        });
        return;
      }

      // If already cancelled, skip
      if (delivery.status === 'CANCELLED') {
        await processedEventsCollection.insertOne({
          eventId,
          createdAt: new Date()
        });
        return;
      }

      // Mark delivery as cancelled
      await deliveriesCollection.updateOne(
        { orderId: data.orderId },
        {
          $set: {
            status: 'CANCELLED',
            cancelledAt: new Date(data.cancelledAt),
            reason: data.reason,
            releasedDriverId: delivery.driverId,
            updatedAt: new Date()
          }
        }
      );

      log.info('Delivery marked as cancelled', { driverId: delivery.driverId });

      // Publish delivery.cancelled event for notification
      await publishEvent(
        channel,
        'delivery_service.delivery_cancelled',
        {
          eventId: `delivery-cancelled-direct-${data.orderId}`,
          eventType: 'delivery.cancelled',
          eventVersion: 1,
          occurredAt: new Date().toISOString(),
          producer: 'delivery-service',
          traceId,
          data: {
            orderId: data.orderId,
            driverId: delivery.driverId,
            reason: data.reason,
            cancelledAt: data.cancelledAt
          }
        }
      );

      // Mark as processed
      await processedEventsCollection.insertOne({
        eventId,
        createdAt: new Date()
      });

      log.info('Published delivery.cancelled event');
    }
  );

  log.info('Subscribed to delivery cancellation events');
}
