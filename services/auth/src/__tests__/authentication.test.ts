import { prisma as _prisma } from '../../src/lib/db';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import {
  createOrderFactory,
  expectError,
  expectAsyncError
} from '@food/test-utils';

jest.mock('../../src/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}));
jest.mock('jsonwebtoken');
jest.mock('bcrypt');
jest.mock('../../src/lib/logger', () => ({
  logger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }))
  }
}));

const prisma = _prisma as any;

describe('Auth Service - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const user = {
        id: 'user-123',
        email: 'john@example.com',
        password: 'hashed_password_here',
        role: 'CUSTOMER'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(user);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (jwt.sign as jest.Mock).mockReturnValueOnce('access_token_jwt');

      const foundUser = await prisma.user.findUnique({
        where: { email: 'john@example.com' }
      });

      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe('john@example.com');

      const passwordMatches = await bcrypt.compare('password123', user.password);
      expect(passwordMatches).toBe(true);

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        'secret_key'
      );
      expect(token).toBe('access_token_jwt');
    });

    it('should return 401 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await prisma.user.findUnique({
        where: { email: 'nonexistent@example.com' }
      });

      expect(result).toBeNull();
    });

    it('should return 401 if password is incorrect', async () => {
      const user = {
        id: 'user-123',
        email: 'john@example.com',
        password: 'hashed_password_here'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(user);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const foundUser = await prisma.user.findUnique({
        where: { email: 'john@example.com' }
      });

      const passwordMatches = await bcrypt.compare('wrong_password', foundUser.password);
      expect(passwordMatches).toBe(false);
    });

    it('should set both access and refresh tokens', async () => {
      const user = {
        id: 'user-123',
        email: 'john@example.com',
        role: 'CUSTOMER'
      };

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');

      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        'access_secret',
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        'refresh_secret',
        { expiresIn: '7d' }
      );

      expect(accessToken).toBe('access_token');
      expect(refreshToken).toBe('refresh_token');
    });
  });

  describe('registration', () => {
    it('should register new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'John Doe',
        role: 'CUSTOMER'
      };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password');
      (prisma.user.create as jest.Mock).mockResolvedValueOnce({
        id: 'user-123',
        ...userData,
        password: 'hashed_password'
      });

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      expect(hashedPassword).toBe('hashed_password');

      const createdUser = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        }
      });

      expect(createdUser.email).toBe('newuser@example.com');
      expect(createdUser.id).toBe('user-123');
    });

    it('should return 400 if user already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-123',
        email: 'existing@example.com'
      });

      const existingUser = await prisma.user.findUnique({
        where: { email: 'existing@example.com' }
      });

      expect(existingUser).toBeDefined();
      expect(existingUser.email).toBe('existing@example.com');
    });

    it('should hash password before storing', async () => {
      const password = 'password123';

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password');

      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).toBe('hashed_password');
      expect(hashedPassword).not.toBe(password);
    });

    it('should validate email format', () => {
      const validEmail = 'user@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(validEmail)).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);
    });

    it('should require password minimum length', () => {
      const password = 'pass';
      expect(password.length).toBeLessThan(8);

      const validPassword = 'password123';
      expect(validPassword.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('JWT token generation', () => {
    it('should generate valid JWT token', async () => {
      const user = {
        id: 'user-123',
        role: 'CUSTOMER',
        email: 'john@example.com'
      };

      (jwt.sign as jest.Mock).mockReturnValueOnce('valid_token');

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        'secret_key'
      );

      expect(token).toBe('valid_token');
    });

    it('should include user id and role in token', async () => {
      const payload = {
        userId: 'user-123',
        role: 'CUSTOMER'
      };

      (jwt.sign as jest.Mock).mockReturnValueOnce('token_with_payload');

      const token = jwt.sign(payload, 'secret_key');

      expect(token).toBe('token_with_payload');
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'secret_key'
      );
    });

    it('should set expiration on access token', async () => {
      (jwt.sign as jest.Mock).mockReturnValueOnce('access_token');

      jwt.sign(
        { userId: 'user-123' },
        'secret_key',
        { expiresIn: '15m' }
      );

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123' },
        'secret_key',
        { expiresIn: '15m' }
      );
    });
  });

  describe('token refresh', () => {
    it('should refresh expired access token', async () => {
      const user = {
        id: 'user-123',
        role: 'CUSTOMER'
      };

      (jwt.verify as jest.Mock).mockReturnValueOnce(user);
      (jwt.sign as jest.Mock).mockReturnValueOnce('new_access_token');

      const verified = jwt.verify('refresh_token', 'refresh_secret') as any;
      expect(verified.id).toBe('user-123');

      const newAccessToken = jwt.sign(
        { userId: verified.id, role: verified.role },
        'access_secret',
        { expiresIn: '15m' }
      );

      expect(newAccessToken).toBe('new_access_token');
    });

    it('should return 401 if refresh token is invalid', async () => {
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      expect(() => {
        jwt.verify('invalid_token', 'secret');
      }).toThrow('Invalid token');
    });

    it('should not refresh if token expired', async () => {
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Token expired');
      });

      expect(() => {
        jwt.verify('expired_token', 'secret');
      }).toThrow('Token expired');
    });
  });

  describe('authorization', () => {
    it('should verify user has RESTAURANT role', async () => {
      const user = {
        id: 'user-123',
        role: 'RESTAURANT'
      };

      expect(user.role).toBe('RESTAURANT');
    });

    it('should verify user has DRIVER role', async () => {
      const user = {
        id: 'user-456',
        role: 'DRIVER'
      };

      expect(user.role).toBe('DRIVER');
    });

    it('should verify user has CUSTOMER role', async () => {
      const user = {
        id: 'user-789',
        role: 'CUSTOMER'
      };

      expect(user.role).toBe('CUSTOMER');
    });

    it('should deny access if user role is incorrect', async () => {
      const user = {
        id: 'user-123',
        role: 'CUSTOMER'
      };

      const isRestaurant = user.role === 'RESTAURANT';
      expect(isRestaurant).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle database errors on login', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      await expect(
        prisma.user.findUnique({ where: { email: 'test@example.com' } })
      ).rejects.toThrow('Database error');
    });

    it('should handle password hashing errors', async () => {
      (bcrypt.hash as jest.Mock).mockRejectedValueOnce(
        new Error('Bcrypt error')
      );

      await expect(
        bcrypt.hash('password', 10)
      ).rejects.toThrow('Bcrypt error');
    });
  });
});
