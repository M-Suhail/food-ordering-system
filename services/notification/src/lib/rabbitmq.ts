import amqp, { Channel, ChannelModel } from 'amqplib';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

const EVENTS_EXCHANGE = 'events';

const QUEUES = [
  { queue: 'notification.order_created', routingKey: 'order.created' },
  { queue: 'notification.kitchen_accepted', routingKey: 'kitchen.accepted' },
  { queue: 'notification.kitchen_rejected', routingKey: 'kitchen.rejected' },
  { queue: 'notification.payment_succeeded', routingKey: 'payment.succeeded' },
  { queue: 'notification.payment_failed', routingKey: 'payment.failed' },
  { queue: 'notification.delivery_assigned', routingKey: 'delivery.assigned' }
];

export async function initRabbitMQ() {
  if (connection && channel) return channel;

  connection = await amqp.connect(process.env.RABBITMQ_URL!);
  channel = await connection.createChannel();

  await channel.assertExchange(EVENTS_EXCHANGE, 'topic', { durable: true });

  for (const q of QUEUES) {
    await channel.assertQueue(q.queue, { durable: true });
    await channel.bindQueue(q.queue, EVENTS_EXCHANGE, q.routingKey);
  }

  return channel;
}

export function getChannel(): Channel {
  if (!channel) throw new Error('RabbitMQ not initialized');
  return channel;
}
