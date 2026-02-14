import { Router } from 'express';

import asyncHandler from '../../middlewares/asyncHandler';

import { PlansController } from './plans.controller';
import { PlansRepository } from './plans.repository';
import { PlansService } from './plans.service';

const plansRouter = Router();

const plansRepository = new PlansRepository();
const plansService = new PlansService(plansRepository);
const plansController = new PlansController(plansService);

plansRouter.get('/', asyncHandler(plansController.getPlans));

export default plansRouter;
