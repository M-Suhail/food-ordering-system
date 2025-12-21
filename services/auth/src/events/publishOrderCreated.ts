import { getChannel } from '../lib/rabbitmq';
import { publishEvent } from '@food/event-bus';
import {
  OrderCreatedV1Schema,
  type OrderCreatedV1
} from '@food/event-contracts';

const ORDER_CREATED_ROUTING_KEY = 'order.created';

export async function publishOrderCreated(input: unknown) {
  const data: OrderCreatedV1 = OrderCreatedV1Schema.parse(input);
  const channel = getChannel();

  await publishEvent(channel, ORDER_CREATED_ROUTING_KEY, {
    eventId: `evt-${Date.now()}`,
    eventType: 'order.created',
    eventVersion: 1,
    occurredAt: new Date().toISOString(),
    producer: 'auth-service',
    data
  });
}


