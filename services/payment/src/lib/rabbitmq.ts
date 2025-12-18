import amqp, { Channel, ChannelModel } from 'amqplib';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export async function initRabbitMQ() {
  if (connection && channel) return;

  const url = process.env.RABBITMQ_URL!;
  connection = await amqp.connect(url);
  channel = await connection.createChannel();

  await channel.assertExchange('events', 'topic', { durable: true });

  const q = await channel.assertQueue(
    'payment_service.kitchen_accepted',
    { durable: true }
  );

  await channel.bindQueue(q.queue, 'events', 'kitchen.accepted');

  connection.on('close', () => {
    connection = null;
    channel = null;
  });
}

export function getChannel(): Channel {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  return channel;
}
