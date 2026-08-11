import type { Repositories } from '../infrastructure/repositories'
import { CollectionService, DesignService, ShapeService } from './vendula.service'

export type Services = {
  collectionService: CollectionService
  designService: DesignService
  shapeService: ShapeService
}

export const createServices = (repositories: Repositories): Services => {
  return {
    collectionService: new CollectionService(repositories.collectionRepository),
    designService: new DesignService(repositories.designRepository),
    shapeService: new ShapeService(repositories.shapeRepository),
  }
}