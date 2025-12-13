import amqp, { Connection, Channel } from 'amqplib';
import { Logger } from 'pino';

let connection: Connection | null = null;
let channel: Channel | null = null;

export async function initRabbitMQ(logger?: Logger) {
  if (connection && channel) return { connection, channel };
  const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  logger?.info({ url }, 'connecting to rabbitmq');
  connection = await amqp.connect(url);
  channel = await connection.createChannel();
  // default exchange for events
  await channel.assertExchange('events', 'topic', { durable: true });
  logger?.info('rabbitmq ready');
  // handle close
  connection.on('close', () => {
    logger?.warn('rabbitmq connection closed');
    connection = null;
    channel = null;
  });
  return { connection, channel };
}

export function getChannel(): Channel {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  return channel;
}
