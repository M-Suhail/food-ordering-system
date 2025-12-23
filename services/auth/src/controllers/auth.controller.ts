import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { findUserByEmail } from '../users/user.service';
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

  const payload = verifyRefreshToken(refreshToken) as any;
  await revokeRefreshToken(refreshToken);

  const newAccessToken = signAccessToken({ sub: payload.sub });
  const newRefreshToken = signRefreshToken({ sub: payload.sub });

  await issueRefreshToken(payload.sub, newRefreshToken);

  res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
}

