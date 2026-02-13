import { Router } from 'express';

import prisma from '../../config/prisma';
import asyncHandler from '../../middlewares/asyncHandler';
import authMiddleware from '../../middlewares/auth.middleware';

import { WebAppController } from './webapp.controller';
import { WebAppRepository } from './webapp.repository';
import { WebAppService } from './webapp.service';

const webAppRouter = Router();

const webAppRepository = new WebAppRepository(prisma);
const webAppService = new WebAppService(webAppRepository, prisma);
const webAppController = new WebAppController(webAppService);

webAppRouter.use(authMiddleware);
webAppRouter.post('/', asyncHandler(webAppController.createWebApp));
webAppRouter.get('/', asyncHandler(webAppController.getWebApps));
webAppRouter.get('/:id', asyncHandler(webAppController.getWebAppById));

export default webAppRouter;
