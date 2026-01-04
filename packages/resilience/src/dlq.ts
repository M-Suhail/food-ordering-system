/**
 * Dead Letter Queue Handler
 * Handles messages that failed to process after max retries
 * Logs them for manual intervention and creates alerts
 */

import { Channel } from 'amqplib';
import { createLogger } from '@food/observability';

export interface DLQMessage {
  originalQueue: string;
  message: unknown;
  errorReason: string;
  retries: number;
  timestamp: string;
}

/**
 * Set up DLQ consumers for all services
 * RabbitMQ automatically routes failed messages to DLQ after max retries
 */
export async function setupDLQConsumer(
  channel: Channel,
  serviceName: string
) {
  const dlqName = `dlq.${serviceName}`;
  const logger = createLogger({ serviceName });
  const log = logger.child({ context: 'DLQConsumer', service: serviceName });

  // Declare the DLQ
  await channel.assertQueue(dlqName, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': '', // Direct exchange (no exchange)
      'x-dead-letter-routing-key': `dlq-processed.${serviceName}` // Route processed DLQ messages
    }
  });

  log.info(`Set up DLQ consumer for ${dlqName}`);

  // Consume DLQ messages
  await channel.consume(dlqName, async (msg) => {
    if (!msg) return;

    const content = msg.content.toString();
    log.error('Message reached DLQ (failed after max retries)', {
      content,
      headers: msg.properties.headers,
      timestamp: new Date().toISOString()
    });

    // TODO: In production, send alert to monitoring system
    // E.g., send to PagerDuty, Slack, email, etc.

    // Acknowledge the message (remove from DLQ after processing)
    channel.ack(msg);
  });
}

/**
 * Setup DLQ monitoring and metrics
 * Tracks the number of messages in DLQ as a metric
 */
export async function monitorDLQDepth(
  channel: Channel,
  serviceName: string
) {
  const dlqName = `dlq.${serviceName}`;
  const logger = createLogger({ serviceName });
  const log = logger.child({
    context: 'DLQMonitoring',
    service: serviceName
  });

  setInterval(async () => {
    try {
      const queueInfo = await channel.checkQueue(dlqName);
      const messageCount = queueInfo.messageCount;

      if (messageCount > 0) {
        log.warn(`DLQ has ${messageCount} messages waiting for manual intervention`);
      }

      // TODO: Emit metric to Prometheus/metrics system
      // e.g., dlq_message_count{service="order"} = messageCount
    } catch (error) {
      log.error('Error checking DLQ depth', error);
    }
  }, 60000); // Check every minute
}
