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

  public async beginProvisioningIfStartable(
    deploymentId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.prisma.deployment.updateMany({
      where: {
        id: deploymentId,
        status: {
          in: ['pending', 'failed'],
        },
        webApp: {
          userId,
        },
      },
      data: {
        status: 'provisioning',
        startedAt: new Date(),
        finishedAt: null,
        errorMessage: null,
      },
    });

    return result.count === 1;
  }

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
            name: true,
            plan: true,
            region: true,
          },
        },
        environment: {
          select: {
            id: true,
            name: true,
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
