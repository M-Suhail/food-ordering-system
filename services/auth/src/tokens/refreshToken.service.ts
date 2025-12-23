import { prisma } from '../lib/db';

export async function issueRefreshToken(userId: string, token: string) {
  return prisma.refreshToken.create({
    data: { userId, token }
  });
}

export async function revokeRefreshToken(token: string) {
  return prisma.refreshToken.update({
    where: { token },
    data: { revoked: true }
  });
}

export async function isRefreshTokenValid(token: string) {
  return prisma.refreshToken.findFirst({
    where: { token, revoked: false }
  });
}
