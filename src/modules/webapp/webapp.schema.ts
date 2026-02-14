import { z } from 'zod';

import { allowedAwsRegions } from '../../config/aws';
import { allowedPlans } from '../../config/plans';

export const allowedRegions = allowedAwsRegions;

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
