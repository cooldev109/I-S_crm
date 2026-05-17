import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';

describe('AuthService', () => {
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') } as unknown as JwtService;

  function makeUser(overrides: Partial<User> = {}): User {
    return {
      id: 'u1',
      email: 'admin@studio.local',
      passwordHash: bcrypt.hashSync('admin1234', 10),
      name: 'Studio Admin',
      role: UserRole.ADMIN,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function makeService(user: User | null): AuthService {
    const users = { findByEmail: jest.fn().mockResolvedValue(user) } as unknown as UsersService;
    return new AuthService(users, jwt);
  }

  it('returns a token and user on valid credentials', async () => {
    const service = makeService(makeUser());
    const result = await service.login('admin@studio.local', 'admin1234');
    expect(result.token).toBe('signed-token');
    expect(result.user.email).toBe('admin@studio.local');
    expect((result.user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('rejects an unknown email', async () => {
    const service = makeService(null);
    await expect(service.login('nobody@x.com', 'whatever1')).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a wrong password', async () => {
    const service = makeService(makeUser());
    await expect(service.login('admin@studio.local', 'wrongpass1')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an inactive account', async () => {
    const service = makeService(makeUser({ active: false }));
    await expect(service.login('admin@studio.local', 'admin1234')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
