import { createLogger } from '@food/observability';

const serviceName =
  process.env.SERVICE_NAME ?? 'delivery-service';

export const logger = createLogger({
  serviceName
});


