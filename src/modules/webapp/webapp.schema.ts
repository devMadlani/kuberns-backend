import { z } from 'zod';

export const allowedRegions = ['us-east-1', 'us-west-1', 'eu-central-1', 'ap-south-1'] as const;
export const allowedPlans = ['starter', 'pro'] as const;

export const createWebAppSchema = z.object({
  name: z.string().min(3, 'name must be at least 3 characters'),
  region: z.enum(allowedRegions),
  plan: z.enum(allowedPlans),
  framework: z.string().min(1, 'framework is required'),
  repository: z.object({
    provider: z.string().min(1, 'repository.provider is required'),
    owner: z.string().min(1, 'repository.owner is required'),
    repo: z.string().min(1, 'repository.repo is required'),
    branch: z.string().min(1, 'repository.branch is required'),
  }),
  port: z.number().int().min(1024).max(65535),
  envVars: z.array(
    z.object({
      key: z.string().min(1, 'env var key is required'),
      value: z.string(),
    }),
  ),
});

export const webAppIdParamSchema = z.object({
  id: z.string().uuid('Invalid webApp id'),
});

export type CreateWebAppInput = z.infer<typeof createWebAppSchema>;
