import type { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '../../database/schema'
import {
  D1CollectionRepository,
  D1DesignRepository,
  D1ShapeRepository,
  D1SeasonRepository,
  D1DesignImageRepository,
  D1CollectionImageRepository,
  D1ShapeImageRepository,
} from './vendula.repository'

export type Repositories = {
  seasonRepository: D1SeasonRepository
  collectionRepository: D1CollectionRepository
  designRepository: D1DesignRepository
  shapeRepository: D1ShapeRepository
  designImageRepository: D1DesignImageRepository
  collectionImageRepository: D1CollectionImageRepository
  shapeImageRepository: D1ShapeImageRepository
}

export const createRepositories = (db: DrizzleD1Database<typeof schema>): Repositories => {
  return {
    seasonRepository: new D1SeasonRepository(db),
    collectionRepository: new D1CollectionRepository(db),
    designRepository: new D1DesignRepository(db),
    shapeRepository: new D1ShapeRepository(db),
    designImageRepository: new D1DesignImageRepository(db),
    collectionImageRepository: new D1CollectionImageRepository(db),
    shapeImageRepository: new D1ShapeImageRepository(db),
  }
}