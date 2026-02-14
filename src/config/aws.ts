import { z } from 'zod';

import { AWS_ACCESS_KEY_ID, AWS_REGION, AWS_SECRET_ACCESS_KEY } from './env';

export const allowedAwsRegions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'eu-south-1',
  'ap-south-1',
  'ap-south-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-southeast-3',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'me-south-1',
  'af-south-1',
  'sa-east-1',
] as const;

const awsRegionSchema = z.enum(allowedAwsRegions);

export type AwsRegion = (typeof allowedAwsRegions)[number];

export type AwsCredentialsInput = {
  accessKeyId: string;
  secretAccessKey: string;
};

export type AwsResolvedConfig = {
  region: AwsRegion;
  credentials: AwsCredentialsInput;
};

export const resolveAwsConfig = (input?: {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
}): AwsResolvedConfig => {
  const region = awsRegionSchema.parse(input?.region ?? AWS_REGION);

  const accessKeyId = input?.accessKeyId ?? AWS_ACCESS_KEY_ID;
  const secretAccessKey = input?.secretAccessKey ?? AWS_SECRET_ACCESS_KEY;

  return {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };
};
