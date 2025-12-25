import { randomUUID } from 'crypto';

export const TRACE_HEADER = 'x-trace-id';

export function getOrCreateTraceId(
  incoming?: string | string[]
): string {
  if (Array.isArray(incoming)) {
    return incoming[0];
  }

  return incoming ?? randomUUID();
}

