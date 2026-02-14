import { allowedAwsRegions } from '../../config/aws';

type RegionMeta = {
  id: string;
  name: string;
  country: string;
};

type FrameworkMeta = {
  id: string;
  name: string;
};

type DatabaseTypeMeta = {
  id: string;
  name: string;
};

const regionMetaMap: Record<string, { name: string; country: string }> = {
  'us-east-1': { name: 'US East 1', country: 'US' },
  'us-east-2': { name: 'US East 2', country: 'US' },
  'us-west-1': { name: 'US West 1', country: 'US' },
  'us-west-2': { name: 'US West 2', country: 'US' },
  'ca-central-1': { name: 'Canada Central 1', country: 'CA' },
  'eu-central-1': { name: 'EU Central 1', country: 'EU' },
  'eu-west-1': { name: 'EU West 1', country: 'EU' },
  'eu-west-2': { name: 'EU West 2', country: 'EU' },
  'eu-west-3': { name: 'EU West 3', country: 'EU' },
  'eu-north-1': { name: 'EU North 1', country: 'EU' },
  'eu-south-1': { name: 'EU South 1', country: 'EU' },
  'ap-south-1': { name: 'AP South 1', country: 'IN' },
  'ap-south-2': { name: 'AP South 2', country: 'IN' },
  'ap-southeast-1': { name: 'AP Southeast 1', country: 'SG' },
  'ap-southeast-2': { name: 'AP Southeast 2', country: 'AU' },
  'ap-southeast-3': { name: 'AP Southeast 3', country: 'ID' },
  'ap-northeast-1': { name: 'AP Northeast 1', country: 'JP' },
  'ap-northeast-2': { name: 'AP Northeast 2', country: 'KR' },
  'ap-northeast-3': { name: 'AP Northeast 3', country: 'JP' },
  'me-south-1': { name: 'Middle East South 1', country: 'BH' },
  'af-south-1': { name: 'Africa South 1', country: 'ZA' },
  'sa-east-1': { name: 'South America East 1', country: 'BR' },
};

const frameworkMeta: FrameworkMeta[] = [
  { id: 'react', name: 'React' },
  { id: 'vue', name: 'Vue.js' },
  { id: 'node', name: 'Node.js' },
  { id: 'next', name: 'Next.js' },
  { id: 'angular', name: 'Angular' },
  { id: 'svelte', name: 'Svelte' },
];

const databaseTypeMeta: DatabaseTypeMeta[] = [
  { id: 'postgresql', name: 'PostgreSQL' },
  { id: 'mysql', name: 'MySQL' },
  { id: 'mongodb', name: 'MongoDB' },
];

export class MetadataRepository {
  public getRegions(): RegionMeta[] {
    return allowedAwsRegions.map((regionId) => {
      const mapped = regionMetaMap[regionId];

      return {
        id: regionId,
        name: mapped?.name ?? regionId,
        country: mapped?.country ?? '--',
      };
    });
  }

  public getFrameworks(): FrameworkMeta[] {
    return frameworkMeta;
  }

  public getDatabaseTypes(): DatabaseTypeMeta[] {
    return databaseTypeMeta;
  }
}
