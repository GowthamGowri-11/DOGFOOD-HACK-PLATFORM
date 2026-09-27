import prisma from '@/lib/prisma';
import { RoleType, SafeUser, UserStatus } from '@/types';

export class UserRepository {
  public static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  public static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  public static async create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    role?: RoleType;
    bio?: string;
  }) {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        fullName: data.fullName.trim(),
        role: data.role || 'PARTICIPANT',
        bio: data.bio,
        isActive: true,
      },
    });
  }

  public static async updateRole(userId: string, role: RoleType) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  public static async updateStatus(userId: string, isActive: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  public static async updateProfile(userId: string, data: {
    fullName?: string;
    bio?: string;
    avatarUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
  }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName !== undefined ? { fullName: data.fullName.trim() } : {}),
        ...(data.bio !== undefined ? { bio: data.bio.trim() } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl.trim() } : {}),
        ...(data.githubUrl !== undefined ? { githubUrl: data.githubUrl.trim() } : {}),
        ...(data.linkedinUrl !== undefined ? { linkedinUrl: data.linkedinUrl.trim() } : {}),
      },
    });
  }

  public static toSafeUser(user: {
    id: string;
    email: string;
    fullName: string;
    role: RoleType;
    isActive: boolean;
    avatarUrl?: string | null;
    bio?: string | null;
    createdAt: Date;
  }): SafeUser & { isActive: boolean; bio?: string | null } {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      isActive: user.isActive,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
    };
  }

  public static async listAll(limit = 100) {
    const users = await prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    return users.map((u) => this.toSafeUser(u));
  }

  public static async findPaginated(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: RoleType;
    status?: 'ACTIVE' | 'INACTIVE';
    sortBy?: 'createdAt' | 'fullName';
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {
      ...(options.role ? { role: options.role } : {}),
      ...(options.status ? { isActive: options.status === 'ACTIVE' } : {}),
      ...(options.search
        ? {
            OR: [
              { fullName: { contains: options.search, mode: 'insensitive' } },
              { email: { contains: options.search, mode: 'insensitive' } },
              { id: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';

    const [totalCount, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
          _count: {
            select: {
              registrations: true,
              teamMembers: true,
              certificates: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      users: users.map((u) => ({
        ...this.toSafeUser(u),
        registrationsCount: u._count.registrations,
        teamsCount: u._count.teamMembers,
        certificatesCount: u._count.certificates,
      })),
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  }
}
