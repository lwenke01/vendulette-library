import type { Repositories } from '../infrastructure/repositories'
import {
  SeasonService,
  CollectionService,
  DesignService,
  ShapeService,
  DesignImageService,
  CollectionImageService,
  ShapeImageService,
} from './vendula.service'

export type Services = {
  seasonService: SeasonService
  collectionService: CollectionService
  designService: DesignService
  shapeService: ShapeService
  designImageService: DesignImageService
  collectionImageService: CollectionImageService
  shapeImageService: ShapeImageService
}

export const createServices = (repositories: Repositories): Services => {
  return {
    seasonService: new SeasonService(repositories.seasonRepository),
    collectionService: new CollectionService(repositories.collectionRepository),
    designService: new DesignService(repositories.designRepository),
    shapeService: new ShapeService(repositories.shapeRepository),
    designImageService: new DesignImageService(repositories.designImageRepository),
    collectionImageService: new CollectionImageService(repositories.collectionImageRepository),
    shapeImageService: new ShapeImageService(repositories.shapeImageRepository),
  }
}