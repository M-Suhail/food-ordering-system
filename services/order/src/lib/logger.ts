import { createLogger } from '@food/observability';

const serviceName =
  process.env.SERVICE_NAME ?? 'order-service';

export const logger = createLogger({
  serviceName
});

