import { DeploymentEngineService } from '../../services/deployment-engine.service';
import { ApiError } from '../../utils/ApiError';

import { DeploymentRepository } from './deployment.repository';
import { StartDeploymentBodyInput, startDeploymentBodySchema } from './deployment.schema';

type StartDeploymentInput = {
  deploymentId: string;
  userId: string;
  body: unknown;
};

export class DeploymentService {
  constructor(
    private readonly deploymentRepository: DeploymentRepository,
    private readonly deploymentEngineService: DeploymentEngineService,
  ) {}

  public async startDeployment(input: StartDeploymentInput) {
    const parsedBody: StartDeploymentBodyInput = startDeploymentBodySchema.parse(input.body);

    return this.deploymentEngineService.startDeployment({
      deploymentId: input.deploymentId,
      userId: input.userId,
      awsOverrides: parsedBody.awsCredentials,
    });
  }

  public async getDeploymentStatus(deploymentId: string, userId: string) {
    const deployment = await this.deploymentRepository.getStatusByIdAndUser(deploymentId, userId);

    if (!deployment) {
      throw new ApiError(404, 'Deployment not found');
    }

    return deployment;
  }

  public async getDeploymentLogs(deploymentId: string, userId: string) {
    const logs = await this.deploymentRepository.getLogsByIdAndUser(deploymentId, userId);

    if (!logs) {
      throw new ApiError(404, 'Deployment not found');
    }

    return logs;
  }
}
