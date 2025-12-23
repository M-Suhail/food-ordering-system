import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authorize(requiredRole?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) return res.sendStatus(401);

    const token = header.replace('Bearer ', '');

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      req.user = payload;

      if (requiredRole && payload.role !== requiredRole) {
        return res.sendStatus(403);
      }

      next();
    } catch {
      res.sendStatus(401);
    }
  };
}
