import { Request, Response } from 'express';
import { ZodError } from 'zod';

import { ApiError } from '../../utils/ApiError';

import { webAppIdParamSchema } from './webapp.schema';
import { WebAppService } from './webapp.service';

export class WebAppController {
  constructor(private readonly webAppService: WebAppService) {}

  public createWebApp = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new ApiError(401, 'Unauthorized');
      }

      const payload = await this.webAppService.createWebApp(req.body, req.user.userId);

      res.status(201).json(payload);
    } catch (error) {
      this.throwMappedError(error);
    }
  };

  public getWebApps = async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const webApps = await this.webAppService.getWebApps(req.user.userId);

    res.status(200).json(webApps);
  };

  public getWebAppById = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new ApiError(401, 'Unauthorized');
      }

      const { id } = webAppIdParamSchema.parse(req.params);
      const webApp = await this.webAppService.getWebAppById(id, req.user.userId);

      res.status(200).json(webApp);
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
