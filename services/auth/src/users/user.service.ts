import bcrypt from 'bcryptjs';
import { prisma } from '../lib/db';
import { CreateUserInput } from './user.model';

const SALT_ROUNDS = 12;

export async function createUser(input: CreateUserInput) {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: (input.role ?? 'USER') as 'USER' | 'ADMIN'
    }
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email }
  });
}

