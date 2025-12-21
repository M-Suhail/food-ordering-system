import amqp, { Channel, ChannelModel } from 'amqplib';
import { Logger } from 'pino';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

/**
 * Exchanges
 */
const EVENTS_EXCHANGE = 'events';
const DLX_EXCHANGE = 'events.dlx';

/**
 * Queues owned by Order service
 */
const QUEUES = [
  {
    queue: 'order_service.order_created',
    routingKey: 'order.created',
    dlq: 'order_service.order_created.dlq'
  },
  {
    queue: 'order_service.kitchen_accepted',
    routingKey: 'kitchen.accepted'
  },
  {
    queue: 'order_service.kitchen_rejected',
    routingKey: 'kitchen.rejected'
  },
  {
    queue: 'order_service.payment_succeeded',
    routingKey: 'payment.succeeded'
  },
  {
    queue: 'order_service.payment_failed',
    routingKey: 'payment.failed'
  },
  {
    queue: 'order_service.delivery_assigned',
    routingKey: 'delivery.assigned'
  }
];

export async function initRabbitMQ(
  logger?: Logger
): Promise<{ connection: ChannelModel; channel: Channel }> {
  if (connection && channel) {
    return { connection, channel };
  }

  const url =
    process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';

  logger?.info({ url }, 'connecting to RabbitMQ');

  try {
    connection = await amqp.connect(url);

    connection.on('error', (err) => {
      logger?.error({ err }, 'RabbitMQ connection error');
    });

    connection.on('close', () => {
      logger?.warn('RabbitMQ connection closed');
      connection = null;
      channel = null;
    });

    channel = await connection.createChannel();

    /**
     * Exchanges
     */
    await channel.assertExchange(EVENTS_EXCHANGE, 'topic', {
      durable: true
    });

    await channel.assertExchange(DLX_EXCHANGE, 'topic', {
      durable: true
    });

    /**
     * Queues
     */
    for (const q of QUEUES) {
      await channel.assertQueue(q.queue, {
        durable: true,
        deadLetterExchange: q.dlq ? DLX_EXCHANGE : undefined
      });

      await channel.bindQueue(
        q.queue,
        EVENTS_EXCHANGE,
        q.routingKey
      );

      if (q.dlq) {
        await channel.assertQueue(q.dlq, { durable: true });

        await channel.bindQueue(
          q.dlq,
          DLX_EXCHANGE,
          q.routingKey
        );
      }
    }

    logger?.info('RabbitMQ ready for order service');

    return { connection, channel };
  } catch (err) {
    logger?.error({ err }, 'failed to initialize RabbitMQ');
    connection = null;
    channel = null;
    throw err;
  }
}

export function getChannel(): Channel {
  if (!channel) {
    throw new Error(
      'RabbitMQ channel not initialized. Call initRabbitMQ() first.'
    );
  }
  return channel;
}

export async function closeRabbitMQ(logger?: Logger) {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    logger?.info('RabbitMQ connection closed gracefully');
  } catch (err) {
    logger?.error({ err }, 'error closing RabbitMQ');
  }
}
