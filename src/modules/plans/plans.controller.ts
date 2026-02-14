import { Request, Response } from 'express';

import { PlansService } from './plans.service';

export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  public getPlans = async (_req: Request, res: Response): Promise<void> => {
    const plans = this.plansService.getPlans();
    res.status(200).json(plans);
  };
}
