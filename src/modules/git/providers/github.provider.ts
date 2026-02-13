import { GITHUB_CALLBACK_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '../../../config/env';
import { ApiError } from '../../../utils/ApiError';

export type GithubOrg = {
  id: number;
  login: string;
  description: string | null;
  avatar_url: string;
};

export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
};

export type GithubBranch = {
  name: string;
};

type GithubAccessTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GithubUserResponse = {
  id: number;
  login: string;
};

export class GithubProvider {
  private readonly baseApiUrl = 'https://api.github.com';

  private readonly oauthUrl = 'https://github.com/login/oauth';

  public buildOAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_CALLBACK_URL,
      scope: 'read:org repo',
      state,
    });

    return `${this.oauthUrl}/authorize?${params.toString()}`;
  }

  public async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch(`${this.oauthUrl}/access_token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK_URL,
      }),
    });

    const payload = (await response.json()) as GithubAccessTokenResponse;

    if (!response.ok || !payload.access_token) {
      throw new ApiError(
        502,
        payload.error_description ?? payload.error ?? 'Failed to exchange code',
      );
    }

    return payload.access_token;
  }

  public async getAuthenticatedUser(token: string): Promise<GithubUserResponse> {
    const response = await this.request<GithubUserResponse>('/user', token);

    return response;
  }

  public async getUserOrgs(token: string): Promise<GithubOrg[]> {
    return this.request<GithubOrg[]>('/user/orgs', token);
  }

  public async getOrgRepos(org: string, token: string): Promise<GithubRepo[]> {
    return this.request<GithubRepo[]>(`/orgs/${encodeURIComponent(org)}/repos`, token);
  }

  public async getUserRepos(token: string): Promise<GithubRepo[]> {
    return this.request<GithubRepo[]>('/user/repos', token);
  }

  public async getRepoBranches(
    owner: string,
    repo: string,
    token: string,
  ): Promise<GithubBranch[]> {
    return this.request<GithubBranch[]>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`,
      token,
    );
  }

  private async request<T>(path: string, token: string): Promise<T> {
    const response = await fetch(`${this.baseApiUrl}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ApiError(response.status, `GitHub API error: ${text}`);
    }

    return (await response.json()) as T;
  }
}
