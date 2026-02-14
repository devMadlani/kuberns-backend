import { Router } from 'express';

import asyncHandler from '../../middlewares/asyncHandler';

import { MetadataController } from './metadata.controller';
import { MetadataRepository } from './metadata.repository';
import { MetadataService } from './metadata.service';

const metadataRouter = Router();

const metadataRepository = new MetadataRepository();
const metadataService = new MetadataService(metadataRepository);
const metadataController = new MetadataController(metadataService);

metadataRouter.get('/', asyncHandler(metadataController.getMetadata));

export default metadataRouter;
