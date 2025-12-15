import { Channel } from 'amqplib';
import { EventEnvelope } from '../events/envelope';

export function publishEvent<T>(
  channel: Channel,
  routingKey: string,
  envelope: EventEnvelope<T>
) {
  const payload = Buffer.from(JSON.stringify(envelope));
  channel.publish('events', routingKey, payload, { persistent: true });
}
