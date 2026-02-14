import { MetadataRepository } from './metadata.repository';

export type MetadataResponse = {
  regions: Array<{ id: string; name: string; country: string }>;
  frameworks: Array<{ id: string; name: string }>;
  databaseTypes: Array<{ id: string; name: string }>;
};

export class MetadataService {
  constructor(private readonly metadataRepository: MetadataRepository) {}

  public getMetadata(): MetadataResponse {
    return {
      regions: this.metadataRepository.getRegions(),
      frameworks: this.metadataRepository.getFrameworks(),
      databaseTypes: this.metadataRepository.getDatabaseTypes(),
    };
  }
}
