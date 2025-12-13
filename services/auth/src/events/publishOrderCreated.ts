import { getChannel } from '../lib/rabbitmq';

export async function publishOrderCreated(order: any) {
  const ch = getChannel();
  const routingKey = 'order.created';
  const payload = {
    eventId: `evt-${Date.now()}`,
    timestamp: Date.now(),
    type: 'order.created',
    data: order
  };
  ch.publish('events', routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
}
