import type { RequestHandler } from 'express';
import { httpRequestsTotal, httpRequestDuration } from './metrics';

export function metricsMiddleware(serviceName: string): RequestHandler {
  return (req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - start) / 1_000_000;

      httpRequestsTotal.inc({
        service: serviceName,
        method: req.method,
        path: req.route?.path ?? req.path,
        status: res.statusCode
      });

      httpRequestDuration.observe(
        {
          service: serviceName,
          method: req.method,
          path: req.route?.path ?? req.path
        },
        durationMs
      );
    });

    next();
  };
}


