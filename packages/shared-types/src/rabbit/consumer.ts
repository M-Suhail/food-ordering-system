import { Channel, ConsumeMessage } from 'amqplib';
import { ZodSchema } from 'zod';

export async function consumeEvent<T>(
  channel: Channel,
  queue: string,
  schema: ZodSchema<T>,
  handler: (data: T) => Promise<void>
) {
  await channel.consume(queue, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    try {
      const parsed = JSON.parse(msg.content.toString());
      const validated = schema.parse(parsed.data);
      await handler(validated);
      channel.ack(msg);
    } catch {
      channel.nack(msg, false, false);
    }
  });
}

