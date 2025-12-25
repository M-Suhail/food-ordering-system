import { createLogger } from '@food/observability';

const serviceName =
  process.env.SERVICE_NAME ?? 'notification-service';

export const logger = createLogger({
  serviceName
});

