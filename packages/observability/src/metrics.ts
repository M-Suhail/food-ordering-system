import client from 'prom-client';

export const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['service', 'method', 'path', 'status']
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in ms',
  labelNames: ['service', 'method', 'path'],
  buckets: [50, 100, 200, 300, 500, 1000, 2000]
});

export const eventsPublishedTotal = new client.Counter({
  name: 'events_published_total',
  help: 'Total events published',
  labelNames: ['service', 'eventType']
});

export const eventsConsumedTotal = new client.Counter({
  name: 'events_consumed_total',
  help: 'Total events consumed',
  labelNames: ['service', 'eventType']
});

export const eventProcessingDuration = new client.Histogram({
  name: 'event_processing_duration_ms',
  help: 'Event processing duration in ms',
  labelNames: ['service', 'eventType'],
  buckets: [10, 50, 100, 200, 500, 1000]
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.registerMetric(eventsPublishedTotal);
register.registerMetric(eventsConsumedTotal);
register.registerMetric(eventProcessingDuration);

export { client };
