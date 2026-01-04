/**
 * Payment Refund Notification Consumer
 * Notifies user about payment refunds
 */

import { Db } from 'mongodb';
import { Channel } from 'amqplib';
import { consumeEvent } from '@food/event-bus';
import {
  PaymentRefundV1Schema,
  type PaymentRefundV1
} from '@food/event-contracts';
import { sendNotification } from '../notifications/sendNotification';
import { logger } from '../lib/logger';

export async function subscribePaymentRefund(
  mongoDb: Db,
  channel: Channel
) {
  const log = logger.child({ context: 'subscribePaymentRefund' });

  await consumeEvent<PaymentRefundV1>(
    channel,
    'notification_service.payment_refund',
    PaymentRefundV1Schema,
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = logger.child({ traceId, orderId: data.orderId });

      log.info('Received payment.refund event');

      const notificationsCollection = mongoDb.collection('notifications');

      // Idempotency
      const eventId = `refund-${data.paymentId}`;
      const processed = await notificationsCollection.findOne({
        eventId
      });

      if (processed) {
        log.info('Refund notification already sent');
        return;
      }

      // Send refund notification
      await sendNotification(
        `Payment Refund for Order ${data.orderId}`,
        `$${data.amount} has been refunded to your original payment method. Reason: ${data.reason.replace(
          /_/g,
          ' '
        )}`
      );

      // Persist notification record
      await notificationsCollection.insertOne({
        eventId,
        orderId: data.orderId,
        paymentId: data.paymentId,
        type: 'PAYMENT_REFUND',
        amount: data.amount,
        reason: data.reason,
        createdAt: new Date()
      });

      log.info('Refund notification sent');
    }
  );

  log.info('Subscribed to payment.refund events');
}
