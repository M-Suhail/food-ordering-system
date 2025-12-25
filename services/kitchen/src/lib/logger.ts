import { createLogger } from '@food/observability';

const serviceName =
  process.env.SERVICE_NAME ?? 'kitchen-service';

export const logger = createLogger({
  serviceName
});

