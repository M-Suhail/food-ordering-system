import amqp, { Channel, ChannelModel } from 'amqplib';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export async function initRabbitMQ() {
  if (connection && channel) return;

  connection = await amqp.connect(process.env.RABBITMQ_URL!);
  channel = await connection.createChannel();

  await channel.assertExchange('events', 'topic', { durable: true });

  const q = await channel.assertQueue(
    'delivery_service.payment_succeeded',
    { durable: true }
  );

  await channel.bindQueue(q.queue, 'events', 'payment.succeeded');
}

export function getChannel(): Channel {
  if (!channel) {
    throw new Error('RabbitMQ not initialized');
  }
  return channel;
}

