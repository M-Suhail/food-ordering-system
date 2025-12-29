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
        const r = req as Request & { auth?: any };

        if (r.auth) {
          proxyReq.setHeader('x-user-id', r.auth.userId);
          proxyReq.setHeader('x-user-email', r.auth.email);
          proxyReq.setHeader('x-user-role', r.auth.role);
        }
      }
    }
  };

  return createProxyMiddleware(options);
}

