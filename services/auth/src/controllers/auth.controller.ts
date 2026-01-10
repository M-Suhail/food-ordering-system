import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { findUserByEmail, createUser } from '../users/user.service';
export async function register(req: Request, res: Response) {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await createUser({ email, password, role });
    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'P2002') { // Prisma unique constraint violation
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed', details: String(err) });
  }
}
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from '../lib/jwt';
import {
  issueRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken
} from '../tokens/refreshToken.service';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return res.sendStatus(401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.sendStatus(401);

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role
  });

  const refreshToken = signRefreshToken({ sub: user.id });
  await issueRefreshToken(user.id, refreshToken);

  res.json({ accessToken, refreshToken });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(400);

  const stored = await isRefreshTokenValid(refreshToken);
  if (!stored) return res.sendStatus(401);

  const payload = verifyRefreshToken(refreshToken) as { sub: string };
  await revokeRefreshToken(refreshToken);

  const newAccessToken = signAccessToken({ sub: payload.sub });
  const newRefreshToken = signRefreshToken({ sub: payload.sub });

  await issueRefreshToken(payload.sub, newRefreshToken);

  res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
}

