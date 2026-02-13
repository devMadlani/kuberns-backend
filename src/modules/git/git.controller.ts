import { Request, Response } from 'express';
import { ZodError } from 'zod';

import { FRONTEND_URL } from '../../config/env';
import { ApiError } from '../../utils/ApiError';

import { GitService } from './git.service';

export class GitController {
  constructor(private readonly gitService: GitService) {}

  public getGithubOAuthUrl = async (_req: Request, res: Response): Promise<void> => {
    const payload = this.gitService.getGithubOAuthUrl();

    res.status(200).json({
      success: true,
      message: 'GitHub OAuth URL generated successfully',
      data: payload,
    });
  };

  public githubCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = await this.gitService.handleGithubCallback(req.query);

      const params = new URLSearchParams({
        githubConnected: 'true',
        githubId: payload.githubId,
        githubUsername: payload.githubUsername,
      });

      res.redirect(`${FRONTEND_URL}/?${params.toString()}`);
    } catch (error) {
      const message = this.extractErrorMessage(error);
      const params = new URLSearchParams({
        githubConnected: 'false',
        error: message,
      });

      res.redirect(`${FRONTEND_URL}/?${params.toString()}`);
    }
  };

  public getGithubOrgs = async (req: Request, res: Response): Promise<void> => {
    try {
      const githubUserId = this.getGithubUserIdFromRequest(req);
      const payload = await this.gitService.getGithubOrgs(githubUserId);

      res.status(200).json({
        success: true,
        message: 'GitHub organizations fetched successfully',
        data: payload,
      });
    } catch (error) {
      this.throwMappedError(error);
    }
  };

  public getGithubRepos = async (req: Request, res: Response): Promise<void> => {
    try {
      const githubUserId = this.getGithubUserIdFromRequest(req);
      const payload = await this.gitService.getGithubRepos(req.query, githubUserId);

      res.status(200).json({
        success: true,
        message: 'GitHub repositories fetched successfully',
        data: payload,
      });
    } catch (error) {
      this.throwMappedError(error);
    }
  };

  public getGithubBranches = async (req: Request, res: Response): Promise<void> => {
    try {
      const githubUserId = this.getGithubUserIdFromRequest(req);
      const payload = await this.gitService.getGithubBranches(req.query, githubUserId);

      res.status(200).json({
        success: true,
        message: 'GitHub branches fetched successfully',
        data: payload,
      });
    } catch (error) {
      this.throwMappedError(error);
    }
  };

  private getGithubUserIdFromRequest(req: Request): string | undefined {
    const headerValue = req.headers['x-github-user-id'];

    if (typeof headerValue === 'string' && headerValue.length > 0) {
      return headerValue;
    }

    return undefined;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof ZodError) {
      return error.issues[0]?.message ?? 'Validation error';
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'GitHub callback failed';
  }

  private throwMappedError(error: unknown): never {
    if (error instanceof ZodError) {
      const issueMessage = error.issues[0]?.message ?? 'Validation error';
      throw new ApiError(400, issueMessage);
    }

    throw error;
  }
}
