import { Router } from 'express';

import prisma from '../../config/prisma';
import asyncHandler from '../../middlewares/asyncHandler';
import authMiddleware from '../../middlewares/auth.middleware';
import { AwsService } from '../../services/aws.service';
import { DeploymentEngineService } from '../../services/deployment-engine.service';

import { DeploymentController } from './deployment.controller';
import { DeploymentRepository } from './deployment.repository';
import { DeploymentService } from './deployment.service';

const deploymentRouter = Router();

const deploymentRepository = new DeploymentRepository(prisma);
const awsService = new AwsService();
const deploymentEngineService = new DeploymentEngineService(deploymentRepository, awsService);
const deploymentService = new DeploymentService(deploymentRepository, deploymentEngineService);
const deploymentController = new DeploymentController(deploymentService);

deploymentRouter.use(authMiddleware);
deploymentRouter.post(
  '/deployments/:deploymentId/start',
  asyncHandler(deploymentController.startDeployment),
);
deploymentRouter.get('/deployments/:id', asyncHandler(deploymentController.getDeploymentStatus));
deploymentRouter.get('/deployments/:id/logs', asyncHandler(deploymentController.getDeploymentLogs));

export default deploymentRouter;
