import amqp, { Channel, ChannelModel, Connection } from 'amqplib';
import { Logger } from 'pino';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

const EVENTS_EXCHANGE = 'events';
const DLX_EXCHANGE = 'events.dlx';

const ORDER_CREATED_QUEUE = 'order_service.order_created';
const ORDER_CREATED_DLQ = 'order_service.order_created.dlq';
const ORDER_CREATED_ROUTING_KEY = 'order.created';

export async function initRabbitMQ(logger?: Logger) {
  if (connection && channel) return { connection, channel };

  const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  logger?.info({ url }, 'connecting to rabbitmq');

  connection = await amqp.connect(url);
  channel = await connection.createChannel();

  /* Exchanges */
  await channel.assertExchange(EVENTS_EXCHANGE, 'topic', { durable: true });
  await channel.assertExchange(DLX_EXCHANGE, 'topic', { durable: true });

  /* Main queue */
  await channel.assertQueue(ORDER_CREATED_QUEUE, {
    durable: true,
    deadLetterExchange: DLX_EXCHANGE,
    deadLetterRoutingKey: ORDER_CREATED_ROUTING_KEY
  });

  await channel.bindQueue(
    ORDER_CREATED_QUEUE,
    EVENTS_EXCHANGE,
    ORDER_CREATED_ROUTING_KEY
  );

  /* Dead letter queue */
  await channel.assertQueue(ORDER_CREATED_DLQ, { durable: true });

  await channel.bindQueue(
    ORDER_CREATED_DLQ,
    DLX_EXCHANGE,
    ORDER_CREATED_ROUTING_KEY
  );

  logger?.info('rabbitmq ready for order service');

  connection.on('close', () => {
    logger?.warn('rabbitmq connection closed');
    connection = null;
    channel = null;
  });

  return { connection, channel };
// ...existing code...
}

export function getChannel(): Channel {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
}

