import { Channel } from 'amqplib';
import { trace, context, SpanKind } from '@opentelemetry/api';
import { EventEnvelope } from '@food/event-contracts';

const EVENTS_EXCHANGE = 'events';
const tracer = trace.getTracer('event-bus');

export async function publishEvent<T>(
  channel: Channel,
  routingKey: string,
  envelope: EventEnvelope<T>
): Promise<void> {
  const payload = Buffer.from(JSON.stringify(envelope));

  return tracer.startActiveSpan(
    `publish ${routingKey}`,
    { kind: SpanKind.PRODUCER },
    async span => {
      try {
        span.setAttribute('messaging.system', 'rabbitmq');
        span.setAttribute('messaging.destination', EVENTS_EXCHANGE);
        span.setAttribute('messaging.routing_key', routingKey);
        span.setAttribute('traceId', envelope.traceId);

        channel.publish(
          EVENTS_EXCHANGE,
          routingKey,
          payload,
          {
            contentType: 'application/json',
            persistent: true,
            headers: {
              traceId: envelope.traceId
            }
          }
        );
      } finally {
        span.end();
      }
    }
  );
}




