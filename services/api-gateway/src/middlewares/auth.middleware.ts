import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  const token = header.replace('Bearer ', '');

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    req.headers['x-user-id'] = payload.sub || payload.userId;
    req.headers['x-user-email'] = payload.email;
    if (payload.role) {
      req.headers['x-user-role'] = payload.role;
    }

    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
