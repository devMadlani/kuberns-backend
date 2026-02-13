import { z } from 'zod';

import { allowedAwsRegions } from '../../config/aws';

export const deploymentIdParamSchema = z.object({
  id: z.string().uuid('Invalid deployment id'),
});

export const startDeploymentParamSchema = z.object({
  deploymentId: z.string().uuid('Invalid deployment id'),
});

export const startDeploymentBodySchema = z
  .object({
    awsCredentials: z
      .object({
        accessKeyId: z.string().min(1, 'AWS access key id is required'),
        secretAccessKey: z.string().min(1, 'AWS secret access key is required'),
        region: z.enum(allowedAwsRegions).optional(),
        amiId: z.string().min(1, 'AWS AMI id is required').optional(),
      })
      .optional(),
  })
  .default({});

export type StartDeploymentBodyInput = z.infer<typeof startDeploymentBodySchema>;
