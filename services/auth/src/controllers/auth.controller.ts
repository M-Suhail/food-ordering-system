import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail } from '../users/user.service';
import { signAccessToken } from '../lib/jwt';

export async function register(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password required' });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'user already exists' });
  }

  const user = await createUser({ email, password });

  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role
  });

  res.status(201).json({ accessToken: token });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password required' });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'invalid credentials' });
  }

  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role
  });

  res.json({ accessToken: token });
}
