import {
  createProxyMiddleware,
  type Options
} from 'http-proxy-middleware';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Request } from 'express';

export function proxy(target: string) {
  const options: Options<IncomingMessage, ServerResponse> = {
    target,
    changeOrigin: true,
    xfwd: true,

    on: {
      proxyReq: (proxyReq, req) => {
        const r = req as Request;

        if (r.headers['x-user-id']) {
          proxyReq.setHeader('x-user-id', String(r.headers['x-user-id']));
          proxyReq.setHeader('x-user-email', String(r.headers['x-user-email']));
          proxyReq.setHeader('x-user-role', String(r.headers['x-user-role']));
        }
      }
    }
  };

  return createProxyMiddleware(options);
}



