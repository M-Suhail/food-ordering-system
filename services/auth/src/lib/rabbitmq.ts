import amqp, { Channel, ChannelModel } from 'amqplib';
import { Logger } from 'pino';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

const EVENTS_EXCHANGE = 'events';

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

    // Default exchange for domain events
    await channel.assertExchange(EVENTS_EXCHANGE, 'topic', {
      durable: true
    });

    logger?.info('RabbitMQ ready');

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

