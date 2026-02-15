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
  'us-east-1': { name: 'N. Virginia', country: 'US' },
  'us-east-2': { name: 'Ohio', country: 'US' },
  'us-west-1': { name: 'N. California', country: 'US' },
  'us-west-2': { name: 'Oregon', country: 'US' },
  'ca-central-1': { name: 'Central', country: 'CA' },
  'eu-central-1': { name: 'Frankfurt', country: 'DE' },
  'eu-west-1': { name: 'Ireland', country: 'IE' },
  'eu-west-2': { name: 'London', country: 'GB' },
  'eu-west-3': { name: 'Paris', country: 'FR' },
  'eu-north-1': { name: 'Stockholm', country: 'SE' },
  'ap-south-1': { name: 'Mumbai', country: 'IN' },
  'ap-southeast-1': { name: 'Singapore', country: 'SG' },
  'ap-southeast-2': { name: 'Sydney', country: 'AU' },
  'ap-northeast-1': { name: 'Tokyo', country: 'JP' },
  'ap-northeast-2': { name: 'Seoul', country: 'KR' },
  'ap-northeast-3': { name: 'Osaka', country: 'JP' },
  'sa-east-1': { name: 'Sao Paulo', country: 'BR' },
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
