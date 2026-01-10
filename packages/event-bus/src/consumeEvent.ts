import { Channel, ConsumeMessage } from 'amqplib';
import { ZodSchema } from 'zod';
import { trace, SpanKind } from '@opentelemetry/api';
import { EventEnvelope } from '@food/event-contracts';

const tracer = trace.getTracer('event-bus');

export async function consumeEvent<T>(
  channel: Channel,
  queue: string,
  schema: ZodSchema<T>,
  handler: (data: T, envelope: EventEnvelope<T>) => Promise<void>
): Promise<void> {
  await channel.consume(queue, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    const raw = JSON.parse(msg.content.toString()) as EventEnvelope<unknown>;

    const traceId =
      raw.traceId ??
      (msg.properties.headers?.traceId as string | undefined) ??
      'unknown';

    return tracer.startActiveSpan(
      `consume ${queue}`,
      {
        kind: SpanKind.CONSUMER,
        attributes: {
          'messaging.system': 'rabbitmq',
          'messaging.destination': queue,
          traceId
        }
      },
      async span => {
        try {
          const data = schema.parse(raw.data);

          const envelope: EventEnvelope<T> = {
            ...raw,
            traceId,
            data
          };

          await handler(data, envelope);

          channel.ack(msg);
        } catch (err) {
          span.recordException(err as Error);
          channel.nack(msg, false, false);
        } finally {
          span.end();
        }
      }
    );
  });
}



