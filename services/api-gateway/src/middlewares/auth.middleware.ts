import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'unauthorized' });

  const token = header.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, process.env.JWT_PUBLIC_KEY!);
    req.headers['x-user'] = JSON.stringify(payload);
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}
