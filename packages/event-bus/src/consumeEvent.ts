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
      const parsed = schema.parse(JSON.parse(msg.content.toString()));
      await handler(parsed);
      channel.ack(msg);
    } catch (err) {
      channel.nack(msg, false, false);
      throw err;
    }
  });
}
