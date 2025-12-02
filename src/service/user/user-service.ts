import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/utils/password';
import { createAuditLog, getChanges } from '@/lib/utils/audit';
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateProfileInput,
  User,
  Profile,
} from '@/types/user';
import { ErrorCodes } from '@/types/api';

export class UserService {
  async createUser(input: CreateUserInput, createdBy: string): Promise<User> {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new Error(ErrorCodes.ALREADY_EXISTS);
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name || null,
        isActive: input.isActive ?? true,
      },
      include: {
        profile: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Create profile
    await prisma.profile.create({
      data: {
        userId: user.id,
      },
    });

    // Assign roles if provided
    if (input.roles && input.roles.length > 0) {
      for (const roleId of input.roles) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId,
            assignedBy: createdBy,
          },
        });
      }
    }

    await createAuditLog({
      action: 'user.created',
      entity: 'User',
      entityId: user.id,
      userId: createdBy,
      newValues: {
        email: user.email,
        name: user.name,
        isActive: user.isActive,
      },
    });

    return this.formatUser(user);
  }

  async updateUser(id: string, input: UpdateUserInput, updatedBy: string): Promise<User> {
    const existing = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    // Check email conflict
    if (input.email && input.email !== existing.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (emailConflict) {
        throw new Error(ErrorCodes.ALREADY_EXISTS);
      }
    }

    const oldValues = {
      email: existing.email,
      name: existing.name,
      isActive: existing.isActive,
      isBlocked: existing.isBlocked,
    };

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(input.email && { email: input.email }),
        ...(input.name !== undefined && { name: input.name }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.isBlocked !== undefined && { isBlocked: input.isBlocked }),
      },
      include: {
        profile: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Update roles if provided
    if (input.roles !== undefined) {
      // Remove all existing roles
      await prisma.userRole.deleteMany({
        where: { userId: id },
      });

      // Add new roles
      if (input.roles.length > 0) {
        for (const roleId of input.roles) {
          await prisma.userRole.create({
            data: {
              userId: id,
              roleId,
              assignedBy: updatedBy,
            },
          });
        }
      }

      // Reload user with updated roles
      const updatedUser = await prisma.user.findUnique({
        where: { id },
        include: {
          profile: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (updatedUser) {
        const changes = getChanges(oldValues, {
          email: updatedUser.email,
          name: updatedUser.name,
          isActive: updatedUser.isActive,
          isBlocked: updatedUser.isBlocked,
        });

        await createAuditLog({
          action: 'user.updated',
          entity: 'User',
          entityId: id,
          userId: updatedBy,
          oldValues: changes.oldValues,
          newValues: changes.newValues,
        });

        return this.formatUser(updatedUser);
      }
    }

    const changes = getChanges(oldValues, {
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
    });

    await createAuditLog({
      action: 'user.updated',
      entity: 'User',
      entityId: id,
      userId: updatedBy,
      oldValues: changes.oldValues,
      newValues: changes.newValues,
    });

    return this.formatUser(user);
  }

  async deleteUser(id: string, deletedBy: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      action: 'user.deleted',
      entity: 'User',
      entityId: id,
      userId: deletedBy,
      oldValues: {
        email: user.email,
        name: user.name,
      },
    });
  }

  async getUser(id: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        userRoles: {
          where: {
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    return this.formatUser(user);
  }

  async getUsers(page: number = 1, pageSize: number = 20, search?: string): Promise<{
    data: User[];
    total: number;
  }> {
    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          userRoles: {
            where: {
              isActive: true,
            },
            include: {
              role: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users.map(u => this.formatUser(u)),
      total,
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    let profile: any;

    if (user.profile) {
      const oldValues = {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        displayName: user.profile.displayName,
        bio: user.profile.bio,
        phone: user.profile.phone,
        country: user.profile.country,
        state: user.profile.state,
        city: user.profile.city,
        address: user.profile.address,
        postalCode: user.profile.postalCode,
        website: user.profile.website,
        linkedin: user.profile.linkedin,
        twitter: user.profile.twitter,
        github: user.profile.github,
        timezone: user.profile.timezone,
        locale: user.profile.locale,
        dateFormat: user.profile.dateFormat,
        timeFormat: user.profile.timeFormat,
      };

      profile = await prisma.profile.update({
        where: { userId },
        data: {
          ...(input.firstName !== undefined && { firstName: input.firstName }),
          ...(input.lastName !== undefined && { lastName: input.lastName }),
          ...(input.displayName !== undefined && { displayName: input.displayName }),
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.country !== undefined && { country: input.country }),
          ...(input.state !== undefined && { state: input.state }),
          ...(input.city !== undefined && { city: input.city }),
          ...(input.address !== undefined && { address: input.address }),
          ...(input.postalCode !== undefined && { postalCode: input.postalCode }),
          ...(input.website !== undefined && { website: input.website || null }),
          ...(input.linkedin !== undefined && { linkedin: input.linkedin || null }),
          ...(input.twitter !== undefined && { twitter: input.twitter || null }),
          ...(input.github !== undefined && { github: input.github || null }),
          ...(input.timezone !== undefined && { timezone: input.timezone }),
          ...(input.locale !== undefined && { locale: input.locale }),
          ...(input.dateFormat !== undefined && { dateFormat: input.dateFormat }),
          ...(input.timeFormat !== undefined && { timeFormat: input.timeFormat }),
          ...(input.metadata !== undefined && { metadata: input.metadata }),
        },
      });

      const changes = getChanges(oldValues, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        bio: profile.bio,
        phone: profile.phone,
        country: profile.country,
        state: profile.state,
        city: profile.city,
        address: profile.address,
        postalCode: profile.postalCode,
        website: profile.website,
        linkedin: profile.linkedin,
        twitter: profile.twitter,
        github: profile.github,
        timezone: profile.timezone,
        locale: profile.locale,
        dateFormat: profile.dateFormat,
        timeFormat: profile.timeFormat,
      });

      await createAuditLog({
        action: 'profile.updated',
        entity: 'Profile',
        entityId: profile.id,
        userId,
        oldValues: changes.oldValues,
        newValues: changes.newValues,
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          userId,
          ...input,
        },
      });

      await createAuditLog({
        action: 'profile.created',
        entity: 'Profile',
        entityId: profile.id,
        userId,
        newValues: input,
      });
    }

    return this.formatProfile(profile);
  }

  private formatUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() || null,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      profile: user.profile ? this.formatProfile(user.profile) : undefined,
      roles: user.userRoles?.map((ur: any) => ({
        id: ur.id,
        role: {
          id: ur.role.id,
          name: ur.role.name,
          slug: ur.role.slug,
        },
        isActive: ur.isActive,
        expiresAt: ur.expiresAt?.toISOString() || null,
      })) || [],
    };
  }

  private formatProfile(profile: any): Profile {
    return {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      displayName: profile.displayName,
      bio: profile.bio,
      phone: profile.phone,
      phoneVerified: profile.phoneVerified,
      alternateEmail: profile.alternateEmail,
      country: profile.country,
      state: profile.state,
      city: profile.city,
      address: profile.address,
      postalCode: profile.postalCode,
      avatar: profile.avatar,
      coverImage: profile.coverImage,
      website: profile.website,
      linkedin: profile.linkedin,
      twitter: profile.twitter,
      github: profile.github,
      timezone: profile.timezone,
      locale: profile.locale,
      dateFormat: profile.dateFormat,
      timeFormat: profile.timeFormat,
      metadata: profile.metadata,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}

export const userService = new UserService();

