import { createLogger } from '@food/observability';

const serviceName =
  process.env.SERVICE_NAME ?? 'api-gateway-service';

export const logger = createLogger({
  serviceName
});

