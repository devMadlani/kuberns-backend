import prisma from '../../config/prisma';

export type UpsertGithubTokenInput = {
  userId: string;
  githubId: string;
  githubUsername: string;
  encryptedToken: string;
};

export class GitRepository {
  public async findUserByGithubId(githubId: string) {
    return prisma.user.findUnique({
      where: {
        githubId,
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });
  }

  public async clearGithubLinkByUserId(userId: string): Promise<void> {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        githubId: null,
        githubUsername: null,
        githubToken: null,
      },
    });
  }

  public async upsertGithubToken(input: UpsertGithubTokenInput): Promise<void> {
    await prisma.user.update({
      where: {
        id: input.userId,
      },
      data: {
        githubId: input.githubId,
        githubUsername: input.githubUsername,
        githubToken: input.encryptedToken,
      },
    });
  }

  public async findTokenByUserId(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        githubToken: true,
      },
    });

    return user?.githubToken ?? null;
  }
}
