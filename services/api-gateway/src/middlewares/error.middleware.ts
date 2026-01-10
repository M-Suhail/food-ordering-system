import { Request, Response } from 'express';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response
) {
  console.error(err);
  res.status(500).json({ error: 'internal_server_error' });
}
