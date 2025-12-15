import { getChannel } from '../lib/rabbitmq';
import {
  ORDER_CREATED,
  ORDER_CREATED_V1,
  OrderCreatedV1Schema
} from '@food/shared-types';
import { publishEvent } from '@food/shared-types/dist/rabbit/publisher';

export async function publishOrderCreated(input: unknown) {
  const data = OrderCreatedV1Schema.parse(input);
  const channel = getChannel();

  publishEvent(channel, ORDER_CREATED, {
    eventId: `evt-${Date.now()}`,
    eventType: ORDER_CREATED,
    eventVersion: ORDER_CREATED_V1,
    occurredAt: new Date().toISOString(),
    producer: 'auth-service',
    data
  });
}

