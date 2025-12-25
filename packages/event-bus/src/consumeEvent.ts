import { Channel, ConsumeMessage } from 'amqplib';
import { ZodSchema } from 'zod';
import { EventEnvelope } from '@food/event-contracts';

export async function consumeEvent<T>(
  channel: Channel,
  queue: string,
  schema: ZodSchema<T>,
  handler: (data: T, envelope: EventEnvelope<T>) => Promise<void>
) {
  await channel.consume(queue, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    try {
      const raw = JSON.parse(msg.content.toString());
      const envelope = raw as EventEnvelope<T>;

      const data = schema.parse(envelope.data);

      await handler(data, envelope);

      channel.ack(msg);
    } catch (err) {
      channel.nack(msg, false, false);
    }
  });
}

