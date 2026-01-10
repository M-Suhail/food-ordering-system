import { PrismaClient } from '../../prisma/generated/auth';

export const prisma = new PrismaClient();

export async function disconnectDb() {
  await prisma.$disconnect();
}
