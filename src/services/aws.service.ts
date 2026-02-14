import {
  DescribeInstancesCommand,
  EC2Client,
  _InstanceType,
  RunInstancesCommand,
  waitUntilInstanceRunning,
} from '@aws-sdk/client-ec2';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

import { AwsCredentialsInput, AwsRegion } from '../config/aws';
import { ApiError } from '../utils/ApiError';

const AMAZON_LINUX_2023_SSM_PARAM =
  '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64';

type LaunchEc2InstanceInput = {
  region: AwsRegion;
  credentials: AwsCredentialsInput;
  instanceType: string;
  amiId: string;
  instanceName: string;
};

type AwsInstanceResult = {
  instanceId: string;
};

export class AwsService {
  public async resolveAmiId(region: AwsRegion): Promise<string> {
    return this.resolveLatestAmi(region);
  }

  public async launchInstance(input: LaunchEc2InstanceInput): Promise<AwsInstanceResult> {
    const client = this.createClient(input.region, input.credentials);
    const instanceType = input.instanceType as _InstanceType;

    const runResult = await client.send(
      new RunInstancesCommand({
        ImageId: input.amiId,
        InstanceType: instanceType,
        MinCount: 1,
        MaxCount: 1,
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              {
                Key: 'Name',
                Value: input.instanceName,
              },
            ],
          },
        ],
      }),
    );

    const instanceId = runResult.Instances?.[0]?.InstanceId;

    if (!instanceId) {
      throw new ApiError(502, 'AWS did not return an instance id');
    }

    return { instanceId };
  }

  public async waitUntilRunning(
    region: string,
    credentials: AwsCredentialsInput,
    instanceId: string,
  ): Promise<void> {
    const client = this.createClient(region, credentials);

    const waiterResult = await waitUntilInstanceRunning(
      {
        client,
        maxWaitTime: 300,
      },
      {
        InstanceIds: [instanceId],
      },
    );

    if (waiterResult.state !== 'SUCCESS') {
      throw new ApiError(
        502,
        `Instance did not enter running state (state: ${waiterResult.state})`,
      );
    }
  }

  public async getPublicIp(
    region: string,
    credentials: AwsCredentialsInput,
    instanceId: string,
  ): Promise<string> {
    const client = this.createClient(region, credentials);

    const describeResult = await client.send(
      new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      }),
    );

    const publicIp =
      describeResult.Reservations?.[0]?.Instances?.[0]?.PublicIpAddress ??
      describeResult.Reservations?.flatMap((reservation) => reservation.Instances ?? []).find(
        (instance) => instance.InstanceId === instanceId,
      )?.PublicIpAddress;

    if (!publicIp) {
      throw new ApiError(502, 'Instance is running but public IP is not available');
    }

    return publicIp;
  }

  private createClient(region: string, credentials: AwsCredentialsInput): EC2Client {
    return new EC2Client({
      region,
      credentials,
    });
  }

  private createSsmClient(region: string): SSMClient {
    return new SSMClient({
      region,
    });
  }

  private async resolveLatestAmi(region: AwsRegion): Promise<string> {
    const client = this.createSsmClient(region);
    const result = await client.send(
      new GetParameterCommand({
        Name: AMAZON_LINUX_2023_SSM_PARAM,
      }),
    );

    const amiId = result.Parameter?.Value?.trim();

    if (!amiId) {
      throw new ApiError(502, `Unable to resolve AMI for region ${region}`);
    }

    return amiId;
  }
}
