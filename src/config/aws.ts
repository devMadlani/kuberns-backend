import { z } from 'zod';

import { AWS_ACCESS_KEY_ID, AWS_AMI_ID, AWS_REGION, AWS_SECRET_ACCESS_KEY } from './env';

export const allowedAwsRegions = ['us-east-1', 'us-west-1', 'eu-central-1', 'ap-south-1'] as const;

const awsRegionSchema = z.enum(allowedAwsRegions);

export type AwsRegion = (typeof allowedAwsRegions)[number];

export type AwsCredentialsInput = {
  accessKeyId: string;
  secretAccessKey: string;
};

export type AwsResolvedConfig = {
  region: AwsRegion;
  amiId: string;
  credentials: AwsCredentialsInput;
};

export const resolveAwsConfig = (input?: {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  amiId?: string;
}): AwsResolvedConfig => {
  const region = awsRegionSchema.parse(input?.region ?? AWS_REGION);
  const amiId = input?.amiId ?? AWS_AMI_ID;
  console.log('Resolved region:', region);
  console.log('Resolved AMI:', amiId);

  const accessKeyId = input?.accessKeyId ?? AWS_ACCESS_KEY_ID;
  const secretAccessKey = input?.secretAccessKey ?? AWS_SECRET_ACCESS_KEY;

  return {
    region,
    amiId,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };
};
