import { createLogger } from '@food/observability';

const serviceName =
  process.env.SERVICE_NAME ?? 'restaurant-service';

export const logger = createLogger({
  serviceName
});

