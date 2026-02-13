import prisma from '../../config/prisma';

type CreateUserInput = {
  email: string;
  password: string;
  emailOtpHash: string;
  emailOtpExpiry: Date;
};

export class AuthRepository {
  public async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  public async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  public async createUser(input: CreateUserInput) {
    return prisma.user.create({
      data: {
        email: input.email,
        password: input.password,
        emailVerified: false,
        emailOtpHash: input.emailOtpHash,
        emailOtpExpiry: input.emailOtpExpiry,
      },
    });
  }

  public async updatePendingUser(input: CreateUserInput) {
    return prisma.user.update({
      where: { email: input.email },
      data: {
        password: input.password,
        emailVerified: false,
        emailOtpHash: input.emailOtpHash,
        emailOtpExpiry: input.emailOtpExpiry,
      },
    });
  }

  public async markEmailVerified(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailOtpHash: null,
        emailOtpExpiry: null,
      },
    });
  }

  public async updateOtp(email: string, emailOtpHash: string, emailOtpExpiry: Date) {
    return prisma.user.update({
      where: { email },
      data: {
        emailOtpHash,
        emailOtpExpiry,
      },
    });
  }
}
