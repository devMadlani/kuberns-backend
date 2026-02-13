import { PrismaClient } from '@prisma/client';

type DeploymentUpdateInput = {
  status?: string;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  errorMessage?: string | null;
};

type InstanceUpdateInput = {
  status?: string;
  instanceType?: string;
  publicIp?: string | null;
};

export class DeploymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async findByIdAndUser(deploymentId: string, userId: string) {
    return this.prisma.deployment.findFirst({
      where: {
        id: deploymentId,
        webApp: {
          userId,
        },
      },
      include: {
        webApp: {
          select: {
            id: true,
            plan: true,
            region: true,
          },
        },
        environment: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  public async updateDeployment(deploymentId: string, input: DeploymentUpdateInput) {
    return this.prisma.deployment.update({
      where: { id: deploymentId },
      data: input,
    });
  }

  public async updateInstanceByEnvironmentId(environmentId: string, input: InstanceUpdateInput) {
    return this.prisma.instance.update({
      where: { environmentId },
      data: input,
    });
  }

  public async createLog(deploymentId: string, level: string, message: string) {
    return this.prisma.deploymentLog.create({
      data: {
        deploymentId,
        level,
        message,
      },
    });
  }

  public async getStatusByIdAndUser(deploymentId: string, userId: string) {
    return this.prisma.deployment.findFirst({
      where: {
        id: deploymentId,
        webApp: {
          userId,
        },
      },
      select: {
        status: true,
        startedAt: true,
        finishedAt: true,
      },
    });
  }

  public async getLogsByIdAndUser(deploymentId: string, userId: string) {
    const deployment = await this.prisma.deployment.findFirst({
      where: {
        id: deploymentId,
        webApp: {
          userId,
        },
      },
      select: {
        logs: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return deployment?.logs ?? null;
  }
}
