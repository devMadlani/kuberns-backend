import { Prisma, PrismaClient } from '@prisma/client';

import { planConfigs } from '../../config/plans';
import { ApiError } from '../../utils/ApiError';

import { WebAppRepository } from './webapp.repository';
import { createWebAppSchema, CreateWebAppInput } from './webapp.schema';

type CreateWebAppResult = {
  webAppId: string;
  deploymentId: string;
  status: 'pending';
};

export class WebAppService {
  constructor(
    private readonly webAppRepository: WebAppRepository,
    private readonly prisma: PrismaClient,
  ) {}

  public async createWebApp(rawBody: unknown, userId: string): Promise<CreateWebAppResult> {
    const parsed = createWebAppSchema.parse(rawBody);

    const existing = await this.webAppRepository.findByUserAndName(userId, parsed.name);

    if (existing) {
      throw new ApiError(409, 'WebApp name already exists for this user');
    }

    const envVarsObject = this.toEnvVarsJson(parsed.envVars);
    const resources = planConfigs[parsed.plan].resources;

    const result = await this.prisma.$transaction(async (tx) => {
      const webApp = await this.webAppRepository.createWebAppTx(tx, {
        name: parsed.name,
        userId,
        region: parsed.region,
        plan: parsed.plan,
        framework: parsed.framework,
        repoProvider: parsed.repository.provider,
        repoOwner: parsed.repository.owner,
        repoName: parsed.repository.repo,
        defaultBranch: parsed.repository.branch,
      });

      const environment = await this.webAppRepository.createEnvironmentTx(tx, {
        webAppId: webApp.id,
        name: 'production',
        branch: parsed.repository.branch,
        port: parsed.port,
        envVars: envVarsObject,
        status: 'active',
      });

      await this.webAppRepository.createInstanceTx(tx, {
        environmentId: environment.id,
        cpu: resources.cpu,
        ram: resources.ram,
        storage: resources.storage,
        instanceType: resources.instanceType,
        status: 'pending',
      });

      const deployment = await this.webAppRepository.createDeploymentTx(tx, {
        webAppId: webApp.id,
        environmentId: environment.id,
        status: 'pending',
      });

      return {
        webAppId: webApp.id,
        deploymentId: deployment.id,
        status: 'pending' as const,
      };
    });

    return result;
  }

  public async getWebApps(userId: string) {
    return this.webAppRepository.findAllByUser(userId);
  }

  public async getWebAppById(id: string, userId: string) {
    const webApp = await this.webAppRepository.findByIdAndUser(id, userId);

    if (!webApp) {
      throw new ApiError(404, 'WebApp not found');
    }

    return webApp;
  }

  public parseWebAppId(id: string): string {
    return id;
  }

  public parseCreatePayload(rawBody: unknown): CreateWebAppInput {
    return createWebAppSchema.parse(rawBody);
  }

  private toEnvVarsJson(envVars: Array<{ key: string; value: string }>): Prisma.JsonObject {
    const result: Record<string, string> = {};

    for (const item of envVars) {
      result[item.key] = item.value;
    }

    return result;
  }
}
