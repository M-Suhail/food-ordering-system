import { createLogger } from '@food/observability';

const serviceName =
  process.env.SERVICE_NAME ?? 'payment-service';

export const logger = createLogger({
  serviceName
});


