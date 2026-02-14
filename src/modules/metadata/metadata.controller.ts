import { Request, Response } from 'express';

import { MetadataService } from './metadata.service';

export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  public getMetadata = async (_req: Request, res: Response): Promise<void> => {
    const metadata = this.metadataService.getMetadata();
    res.status(200).json(metadata);
  };
}
