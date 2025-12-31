import { Request, Response, NextFunction } from 'express';

export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.headers['x-user-role'];

    if (!role || !allowedRoles.includes(String(role))) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}
