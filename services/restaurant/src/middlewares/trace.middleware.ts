import { Request, Response, NextFunction } from 'express';
import { getOrCreateTraceId, TRACE_HEADER } from '@food/observability';

export function traceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const traceId = getOrCreateTraceId(req.headers[TRACE_HEADER]);
  req.headers[TRACE_HEADER] = traceId;
  res.setHeader(TRACE_HEADER, traceId);
  (req as Request & { traceId?: string }).traceId = traceId;
  next();
}
