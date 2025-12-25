import { Channel, ConsumeMessage } from 'amqplib';
import { ZodSchema } from 'zod';
import { EventEnvelope } from '@food/event-contracts';

export async function consumeEvent<T>(
  channel: Channel,
  queue: string,
  schema: ZodSchema<T>,
  handler: (data: T, envelope: EventEnvelope<T>) => Promise<void>
): Promise<void> {
  await channel.consume(queue, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    try {
      const raw = JSON.parse(msg.content.toString()) as EventEnvelope<unknown>;

      const data = schema.parse(raw.data);

      const envelope: EventEnvelope<T> = {
        ...raw,
        data
      };

      await handler(data, envelope);

      channel.ack(msg);
    } catch (err) {
      // Phase 6.1: poison messages go to DLQ
      channel.nack(msg, false, false);
    }
  });
}


