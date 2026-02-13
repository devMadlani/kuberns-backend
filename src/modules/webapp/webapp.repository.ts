import { Prisma, PrismaClient } from '@prisma/client';

export type CreateWebAppTxInput = {
  name: string;
  userId: string;
  region: string;
  plan: string;
  framework: string;
  repoProvider: string;
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
};

export type CreateEnvironmentTxInput = {
  webAppId: string;
  name: string;
  branch: string;
  port: number;
  envVars: Prisma.JsonObject;
  status: string;
};

export type CreateInstanceTxInput = {
  environmentId: string;
  cpu: number;
  ram: number;
  storage: number;
  instanceType: string;
  status: string;
};

export type CreateDeploymentTxInput = {
  webAppId: string;
  environmentId: string;
  status: string;
};

export class WebAppRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async findByUserAndName(userId: string, name: string) {
    return this.prisma.webApp.findUnique({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
    });
  }

  public async createWebAppTx(tx: Prisma.TransactionClient, input: CreateWebAppTxInput) {
    return tx.webApp.create({
      data: input,
    });
  }

  public async createEnvironmentTx(tx: Prisma.TransactionClient, input: CreateEnvironmentTxInput) {
    return tx.environment.create({
      data: input,
    });
  }

  public async createInstanceTx(tx: Prisma.TransactionClient, input: CreateInstanceTxInput) {
    return tx.instance.create({
      data: input,
    });
  }

  public async createDeploymentTx(tx: Prisma.TransactionClient, input: CreateDeploymentTxInput) {
    return tx.deployment.create({
      data: input,
    });
  }

  public async findAllByUser(userId: string) {
    return this.prisma.webApp.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async findByIdAndUser(id: string, userId: string) {
    return this.prisma.webApp.findFirst({
      where: { id, userId },
      include: {
        environments: {
          include: {
            instance: true,
            deployments: true,
          },
        },
        deployments: true,
      },
    });
  }
}
