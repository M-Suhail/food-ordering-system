import {
  createProxyMiddleware,
  type Options
} from 'http-proxy-middleware';
import type { IncomingMessage } from 'http';
import type { ServerResponse } from 'http';

export function proxy(target: string) {
  const options: Options<IncomingMessage, ServerResponse> = {
    target,
    changeOrigin: true,
    xfwd: true,

    on: {
      proxyReq: (proxyReq, req) => {
        const user = (req as any).headers['x-user'];
        if (user) {
          proxyReq.setHeader('x-user', String(user));
        }
      }
    }
  };

  return createProxyMiddleware(options);
}
