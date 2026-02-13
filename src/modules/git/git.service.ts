import { randomUUID } from 'crypto';

import { z } from 'zod';

import { ApiError } from '../../utils/ApiError';
import { decryptToken, encryptToken } from '../../utils/crypto';

import { GitRepository } from './git.repository';
import { GithubProvider } from './providers/github.provider';

const callbackQuerySchema = z.object({
  code: z.string().min(1, 'Missing oauth code'),
});

const orgQuerySchema = z.object({
  org: z
    .string()
    .optional()
    .transform((value) => value?.trim())
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

const branchesQuerySchema = z.object({
  owner: z.string().min(1, 'owner is required'),
  repo: z.string().min(1, 'repo is required'),
});

export class GitService {
  constructor(
    private readonly gitRepository: GitRepository,
    private readonly githubProvider: GithubProvider,
  ) {}

  public getGithubOAuthUrl(): { url: string } {
    const state = randomUUID();
    const url = this.githubProvider.buildOAuthUrl(state);

    return { url };
  }

  public async handleGithubCallback(
    rawQuery: unknown,
  ): Promise<{ githubId: string; githubUsername: string }> {
    const { code } = callbackQuerySchema.parse(rawQuery);

    const accessToken = await this.githubProvider.exchangeCodeForToken(code);
    const githubUser = await this.githubProvider.getAuthenticatedUser(accessToken);
    const encryptedToken = encryptToken(accessToken);

    await this.gitRepository.upsertGithubToken({
      githubId: String(githubUser.id),
      githubUsername: githubUser.login,
      encryptedToken,
    });

    return {
      githubId: String(githubUser.id),
      githubUsername: githubUser.login,
    };
  }

  public async getGithubOrgs(githubUserId?: string): Promise<unknown> {
    const token = await this.resolveAccessToken(githubUserId);
    return this.githubProvider.getUserOrgs(token);
  }

  public async getGithubRepos(rawQuery: unknown, githubUserId?: string): Promise<unknown> {
    const { org } = orgQuerySchema.parse(rawQuery);
    const token = await this.resolveAccessToken(githubUserId);

    if (org) {
      return this.githubProvider.getOrgRepos(org, token);
    }

    return this.githubProvider.getUserRepos(token);
  }

  public async getGithubBranches(rawQuery: unknown, githubUserId?: string): Promise<unknown> {
    const { owner, repo } = branchesQuerySchema.parse(rawQuery);
    const token = await this.resolveAccessToken(githubUserId);

    return this.githubProvider.getRepoBranches(owner, repo, token);
  }

  private async resolveAccessToken(githubUserId?: string): Promise<string> {
    const encryptedToken = githubUserId
      ? await this.gitRepository.findTokenByGithubId(githubUserId)
      : await this.gitRepository.findLatestToken();

    if (!encryptedToken) {
      throw new ApiError(401, 'No GitHub token found. Complete OAuth callback first.');
    }

    try {
      return decryptToken(encryptedToken);
    } catch (_error) {
      throw new ApiError(500, 'Stored GitHub token could not be decrypted');
    }
  }
}
