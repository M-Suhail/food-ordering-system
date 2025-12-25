import pino, { Logger } from 'pino';

export interface CreateLoggerOptions {
  serviceName: string;
}

export function createLogger(
  options: CreateLoggerOptions
): Logger {
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    base: {
      service: options.serviceName
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: ['password', 'passwordHash', 'token', 'refreshToken'],
      censor: '[REDACTED]'
    }
  });
}

