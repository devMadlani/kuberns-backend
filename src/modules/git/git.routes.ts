import { Router } from 'express';

import asyncHandler from '../../middlewares/asyncHandler';
import authMiddleware from '../../middlewares/auth.middleware';

import { GitController } from './git.controller';
import { GitRepository } from './git.repository';
import { GitService } from './git.service';
import { GithubProvider } from './providers/github.provider';

const gitRouter = Router();

const gitRepository = new GitRepository();
const githubProvider = new GithubProvider();
const gitService = new GitService(gitRepository, githubProvider);
const gitController = new GitController(gitService);

gitRouter.use(authMiddleware);
gitRouter.get('/github/oauth/url', asyncHandler(gitController.getGithubOAuthUrl));
gitRouter.get('/github/callback', asyncHandler(gitController.githubCallback));
gitRouter.get('/github/orgs', asyncHandler(gitController.getGithubOrgs));
gitRouter.get('/github/repos', asyncHandler(gitController.getGithubRepos));
gitRouter.get('/github/branches', asyncHandler(gitController.getGithubBranches));

export default gitRouter;
