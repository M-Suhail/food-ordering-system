import {
  createProxyMiddleware,
  type Options
} from 'http-proxy-middleware';

import type { IncomingMessage, ServerResponse } from 'http';
import type { Request } from 'express';

export function proxy(
  target: string,
  customOptions: Partial<Options<IncomingMessage, ServerResponse>> = {}
) {
  const options: Options<IncomingMessage, ServerResponse> = {
    target,
    changeOrigin: true,
    xfwd: true,
    on: {
      proxyReq: (proxyReq, req) => {
        const r = req as Request & { auth?: any };
        // Forward auth context (if present)
        if (r.auth) {
          proxyReq.setHeader('x-user-id', r.auth.userId);
          proxyReq.setHeader('x-user-email', r.auth.email);
          proxyReq.setHeader('x-user-role', r.auth.role);
        }
        if (r.body && Object.keys(r.body).length > 0) {
          const bodyData = JSON.stringify(r.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      }
    },
    ...customOptions
  };
  // Merge nested 'on' handlers if provided in customOptions
  if (customOptions.on) {
    options.on = { ...options.on, ...customOptions.on };
  }
  return createProxyMiddleware(options);
}


