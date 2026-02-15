import { resolveAwsConfig } from '../config/aws';
import logger from '../config/logger';
import { planConfigs } from '../config/plans';
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
  };
};

type StartDeploymentResult = {
  publicIp: string;
  status: 'active';
};

export class DeploymentEngineService {
  constructor(
    private readonly deploymentRepository: DeploymentRepository,
    private readonly awsService: AwsService,
  ) {}

  public async startDeployment(input: StartDeploymentInput): Promise<StartDeploymentResult> {
    logger.warn(
      `[DeploymentStart] Received start request deploymentId=${input.deploymentId} userId=${input.userId} hasAccessKeyOverride=${Boolean(
        input.awsOverrides?.accessKeyId,
      )} hasSecretKeyOverride=${Boolean(input.awsOverrides?.secretAccessKey)} hasRegionOverride=${Boolean(
        input.awsOverrides?.region,
      )}`,
    );

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
    logger.warn(
      `[DeploymentStart] Resolved AWS config deploymentId=${input.deploymentId} region=${awsConfig.region} credentialSource=${
        awsConfig.credentials ? 'explicit-static' : 'default-provider-chain'
      }`,
    );

    let lifecycleStarted = false;

    try {
      const lockAcquired = await this.deploymentRepository.beginProvisioningIfStartable(
        input.deploymentId,
        input.userId,
      );

      if (!lockAcquired) {
        logger.warn(
          `[DeploymentStart] Lock rejected deploymentId=${input.deploymentId} currentStatus=${deployment.status}`,
        );
        throw new ApiError(409, `Deployment cannot be started from status: ${deployment.status}`);
      }

      lifecycleStarted = true;

      await this.deploymentRepository.createLog(
        input.deploymentId,
        'info',
        `Starting provisioning in ${awsConfig.region}`,
      );
      await this.deploymentRepository.createLog(input.deploymentId, 'info', 'Resolving AMI...');

      const amiId = await this.awsService.resolveAmiId(awsConfig.region);
      await this.deploymentRepository.createLog(
        input.deploymentId,
        'info',
        `AMI resolved: ${amiId}`,
      );

      await this.deploymentRepository.updateInstanceByEnvironmentId(deployment.environmentId, {
        status: 'provisioning',
        instanceType: mappedInstanceType,
      });

      const instanceName = deployment.webApp.name;

      const { instanceId } = await this.awsService.launchInstance({
        region: awsConfig.region,
        amiId,
        credentials: awsConfig.credentials,
        instanceType: mappedInstanceType,
        instanceName,
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
      logger.warn(
        `[DeploymentStart] Failed deploymentId=${input.deploymentId} lifecycleStarted=${lifecycleStarted} error=${message}`,
      );

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
    if (plan in planConfigs) {
      return planConfigs[plan as keyof typeof planConfigs].resources.instanceType;
    }

    throw new ApiError(400, `Unsupported plan: ${plan}`);
  }
}
