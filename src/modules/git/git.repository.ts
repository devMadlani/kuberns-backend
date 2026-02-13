import prisma from '../../config/prisma';

export type UpsertGithubTokenInput = {
  githubId: string;
  githubUsername: string;
  encryptedToken: string;
};

export class GitRepository {
  public async upsertGithubToken(input: UpsertGithubTokenInput): Promise<void> {
    await prisma.user.upsert({
      where: {
        githubId: input.githubId,
      },
      update: {
        githubUsername: input.githubUsername,
        githubToken: input.encryptedToken,
      },
      create: {
        githubId: input.githubId,
        githubUsername: input.githubUsername,
        githubToken: input.encryptedToken,
      },
    });
  }

  public async findTokenByGithubId(githubId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: {
        githubId,
      },
      select: {
        githubToken: true,
      },
    });

    return user?.githubToken ?? null;
  }

  public async findLatestToken(): Promise<string | null> {
    const user = await prisma.user.findFirst({
      where: {
        githubToken: {
          not: null,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        githubToken: true,
      },
    });

    return user?.githubToken ?? null;
  }
}
