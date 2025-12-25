import { createLogger } from '@food/observability';

const serviceName =
  process.env.SERVICE_NAME ?? 'auth-service';

export const logger = createLogger({
  serviceName
});

