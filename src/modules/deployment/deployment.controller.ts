import { Request, Response } from 'express';
import { ZodError } from 'zod';

import { ApiError } from '../../utils/ApiError';

import {
  deploymentIdParamSchema,
  startDeploymentParamSchema,
  StartDeploymentBodyInput,
} from './deployment.schema';
import { DeploymentService } from './deployment.service';

export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) {}

  public startDeployment = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new ApiError(401, 'Unauthorized');
      }

      const { deploymentId } = startDeploymentParamSchema.parse(req.params);
      const body = req.body as StartDeploymentBodyInput | undefined;

      const result = await this.deploymentService.startDeployment({
        deploymentId,
        userId: req.user.userId,
        body,
      });

      res.status(200).json(result);
    } catch (error) {
      this.throwMappedError(error);
    }
  };

  public getDeploymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new ApiError(401, 'Unauthorized');
      }

      const { id } = deploymentIdParamSchema.parse(req.params);
      const result = await this.deploymentService.getDeploymentStatus(id, req.user.userId);

      res.status(200).json(result);
    } catch (error) {
      this.throwMappedError(error);
    }
  };

  public getDeploymentLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new ApiError(401, 'Unauthorized');
      }

      const { id } = deploymentIdParamSchema.parse(req.params);
      const logs = await this.deploymentService.getDeploymentLogs(id, req.user.userId);

      res.status(200).json(logs);
    } catch (error) {
      this.throwMappedError(error);
    }
  };

  private throwMappedError(error: unknown): never {
    if (error instanceof ZodError) {
      const issueMessage = error.issues[0]?.message ?? 'Validation error';
      throw new ApiError(400, issueMessage);
    }

    throw error;
  }
}
