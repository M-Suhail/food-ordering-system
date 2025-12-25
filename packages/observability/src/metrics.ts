import client from 'prom-client';

client.collectDefaultMetrics();

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['service', 'method', 'path', 'status']
});

export const eventConsumedTotal = new client.Counter({
  name: 'event_consumed_total',
  help: 'Total number of events consumed',
  labelNames: ['service', 'event']
});

export const register = client.register;
