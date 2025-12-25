import { Channel } from 'amqplib';
import { EventEnvelope } from '@food/event-contracts';

const EVENTS_EXCHANGE = 'events';

export async function publishEvent<T>(
  channel: Channel,
  routingKey: string,
  envelope: EventEnvelope<T>
) {
  const payload = Buffer.from(JSON.stringify(envelope));

  channel.publish(
    EVENTS_EXCHANGE,
    routingKey,
    payload,
    {
      contentType: 'application/json',
      persistent: true
    }
  );
}

