import { Channel } from 'amqplib';

export async function publishEvent(
  channel: Channel,
  routingKey: string,
  payload: unknown
) {
  channel.publish(
    'events',
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );
}
