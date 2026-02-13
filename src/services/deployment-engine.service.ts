import { resolveAwsConfig } from '../config/aws';
import { DeploymentRepository } from '../modules/deployment/deployment.repository';
import { ApiError } from '../utils/ApiError';

import { AwsService } from './aws.service';

type StartDeploymentInput = {
  deploymentId: string;
  userId: string;
  awsOverrides?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    amiId?: string;
  };
};

type StartDeploymentResult = {
  publicIp: string;
  status: 'active';
};

type SupportedPlan = 'starter' | 'pro';

const planToInstanceType: Record<SupportedPlan, string> = {
  starter: 't2.micro',
  pro: 't3.medium',
};

export class DeploymentEngineService {
  constructor(
    private readonly deploymentRepository: DeploymentRepository,
    private readonly awsService: AwsService,
  ) {}

  public async startDeployment(input: StartDeploymentInput): Promise<StartDeploymentResult> {
    const deployment = await this.deploymentRepository.findByIdAndUser(
      input.deploymentId,
      input.userId,
    );

    if (!deployment) {
      throw new ApiError(404, 'Deployment not found');
    }

    const mappedInstanceType = this.resolveInstanceType(deployment.webApp.plan);
    const awsConfig = resolveAwsConfig({
      ...input.awsOverrides,
      region: input.awsOverrides?.region ?? deployment.webApp.region,
    });

    let lifecycleStarted = false;

    try {
      await this.deploymentRepository.updateDeployment(input.deploymentId, {
        status: 'provisioning',
        startedAt: new Date(),
        finishedAt: null,
        errorMessage: null,
      });
      lifecycleStarted = true;

      await this.deploymentRepository.createLog(
        input.deploymentId,
        'info',
        `Starting provisioning in ${awsConfig.region}`,
      );

      await this.deploymentRepository.updateInstanceByEnvironmentId(deployment.environmentId, {
        status: 'provisioning',
        instanceType: mappedInstanceType,
      });

      const { instanceId } = await this.awsService.launchInstance({
        region: awsConfig.region,
        amiId: awsConfig.amiId,
        credentials: awsConfig.credentials,
        instanceType: mappedInstanceType,
      });
      await this.deploymentRepository.createLog(
        input.deploymentId,
        'info',
        `Instance created with id ${instanceId}`,
      );

      await this.deploymentRepository.updateDeployment(input.deploymentId, {
        status: 'deploying',
      });
      await this.deploymentRepository.createLog(
        input.deploymentId,
        'info',
        'Waiting for instance running state',
      );

      await this.awsService.waitUntilRunning(awsConfig.region, awsConfig.credentials, instanceId);
      const publicIp = await this.awsService.getPublicIp(
        awsConfig.region,
        awsConfig.credentials,
        instanceId,
      );

      await this.deploymentRepository.updateInstanceByEnvironmentId(deployment.environmentId, {
        status: 'active',
        publicIp,
      });
      await this.deploymentRepository.createLog(
        input.deploymentId,
        'info',
        `Public IP assigned: ${publicIp}`,
      );

      await this.deploymentRepository.updateDeployment(input.deploymentId, {
        status: 'active',
        finishedAt: new Date(),
      });
      await this.deploymentRepository.createLog(input.deploymentId, 'info', 'Deployment active');

      return {
        publicIp,
        status: 'active',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown deployment error';

      if (lifecycleStarted) {
        await this.deploymentRepository.updateDeployment(input.deploymentId, {
          status: 'failed',
          finishedAt: new Date(),
          errorMessage: message,
        });
        await this.deploymentRepository.updateInstanceByEnvironmentId(deployment.environmentId, {
          status: 'failed',
        });
        await this.deploymentRepository.createLog(input.deploymentId, 'error', message);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(502, `AWS provisioning failed: ${message}`);
    }
  }

  private resolveInstanceType(plan: string): string {
    if (plan === 'starter') {
      return planToInstanceType.starter;
    }

    if (plan === 'pro') {
      return planToInstanceType.pro;
    }

    throw new ApiError(400, `Unsupported plan: ${plan}`);
  }
}
