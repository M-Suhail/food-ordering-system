import pino from 'pino';

const base = pino({ level: process.env.LOG_LEVEL || 'info' });

export function childLogger(service: string) {
  return base.child({ service });
}
