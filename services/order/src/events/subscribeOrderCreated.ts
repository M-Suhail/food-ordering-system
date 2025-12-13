import { getChannel } from '../lib/rabbitmq';
import { childLogger } from '../lib/logger';

export async function subscribeOrderCreated() {
  const logger = childLogger('order.events');
  const ch = getChannel();
  const q = 'order_service.order_created';
  // consume messages
  await ch.consume(
    q,
    msg => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        logger.info({ payload }, 'received order.created');
        // TODO: implement order creation workflow and idempotency checks
        ch.ack(msg);
      } catch (err) {
        logger.error({ err }, 'failed to process message');
        // simple retry: nack without requeue false moves to dead letter if DLQ configured
        ch.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
}
