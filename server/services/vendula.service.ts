import type { seasons, collections, designs, shapes, designImages, collectionImages, shapeImages } from '../../database/schema'
import type { Season, Collection, Design, Shape, DesignImage, CollectionImage, ShapeImage } from '../../database/schema/vendula'
import type {
  SeasonRepository,
  CollectionRepository,
  DesignRepository,
  ShapeRepository,
  DesignImageRepository,
  CollectionImageRepository,
  ShapeImageRepository,
} from '../infrastructure/vendula.repository'

// ─────────────────────────────────────────────────────────────
// Season Service
// ─────────────────────────────────────────────────────────────

export class SeasonService {
  constructor(private readonly seasonRepository: SeasonRepository) {}

  async create(season: typeof seasons.$inferInsert): Promise<Season> {
    // Business logic: validate season name uniqueness, year range, etc.
    if (!season.name || !season.year) {
      throw new Error('Season name and year are required')
    }

    return this.seasonRepository.create(season)
  }

  async findAll(): Promise<Season[]> {
    return this.seasonRepository.findAll()
  }

  async findById(id: number): Promise<Season | undefined> {
    return this.seasonRepository.findById(id)
  }

  async findByYear(year: number): Promise<Season[]> {
    return this.seasonRepository.findByYear(year)
  }

  async findCurrent(): Promise<Season | undefined> {
    return this.seasonRepository.findCurrent()
  }

  async update(id: number, season: Partial<typeof seasons.$inferInsert>): Promise<Season | undefined> {
    // Business logic: validate updates
    return this.seasonRepository.update(id, season)
  }

  async delete(id: number): Promise<Season | undefined> {
    // Business logic: check if season has collections before deleting
    return this.seasonRepository.delete(id)
  }

  async reorder(seasonIds: number[]): Promise<void> {
    // Business logic: validate all IDs exist
    return this.seasonRepository.reorder(seasonIds)
  }
}

// ─────────────────────────────────────────────────────────────
// Collection Service
// ─────────────────────────────────────────────────────────────

export class CollectionService {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async create(collection: typeof collections.$inferInsert): Promise<Collection> {
    // Business logic: validate required fields, season exists, etc.
    if (!collection.name) {
      throw new Error('Collection name is required')
    }

    return this.collectionRepository.create(collection)
  }

  async findAll(): Promise<Collection[]> {
    return this.collectionRepository.findAll()
  }

  async findById(id: number): Promise<Collection | undefined> {
    return this.collectionRepository.findById(id)
  }

  async findBySeason(seasonId: number): Promise<Collection[]> {
    return this.collectionRepository.findBySeason(seasonId)
  }

  async findByYear(year: number): Promise<Collection[]> {
    return this.collectionRepository.findByYear(year)
  }

  async update(id: number, collection: Partial<typeof collections.$inferInsert>): Promise<Collection | undefined> {
    // Business logic: validate updates
    return this.collectionRepository.update(id, collection)
  }

  async delete(id: number): Promise<Collection | undefined> {
    // Business logic: cascade delete designs and images
    return this.collectionRepository.delete(id)
  }
}

// ─────────────────────────────────────────────────────────────
// Design Service
// ─────────────────────────────────────────────────────────────

export class DesignService {
  constructor(private readonly designRepository: DesignRepository) {}

  async create(design: typeof designs.$inferInsert): Promise<Design> {
    // Business logic: validate collection exists, SKU uniqueness, etc.
    if (!design.name || !design.collectionId) {
      throw new Error('Design name and collection ID are required')
    }

    return this.designRepository.create(design)
  }

  async findAll(): Promise<Design[]> {
    return this.designRepository.findAll()
  }

  async findById(id: number): Promise<Design | undefined> {
    return this.designRepository.findById(id)
  }

  async findByCollection(collectionId: number): Promise<Design[]> {
    return this.designRepository.findByCollection(collectionId)
  }

  async findByShape(shapeId: number): Promise<Design[]> {
    return this.designRepository.findByShape(shapeId)
  }

  async update(id: number, design: Partial<typeof designs.$inferInsert>): Promise<Design | undefined> {
    // Business logic: validate updates, SKU changes, etc.
    return this.designRepository.update(id, design)
  }

  async delete(id: number): Promise<Design | undefined> {
    // Business logic: cascade delete images
    return this.designRepository.delete(id)
  }

  async deleteByCollection(collectionId: number): Promise<void> {
    // Business logic: batch delete designs for a collection
    return this.designRepository.deleteByCollection(collectionId)
  }
}

// ─────────────────────────────────────────────────────────────
// Shape Service
// ─────────────────────────────────────────────────────────────

export class ShapeService {
  constructor(private readonly shapeRepository: ShapeRepository) {}

  async create(shape: typeof shapes.$inferInsert): Promise<Shape> {
    // Business logic: validate name uniqueness
    if (!shape.name) {
      throw new Error('Shape name is required')
    }

    return this.shapeRepository.create(shape)
  }

  async findAll(): Promise<Shape[]> {
    return this.shapeRepository.findAll()
  }

  async findById(id: number): Promise<Shape | undefined> {
    return this.shapeRepository.findById(id)
  }

  async update(id: number, shape: Partial<typeof shapes.$inferInsert>): Promise<Shape | undefined> {
    // Business logic: validate name uniqueness on update
    return this.shapeRepository.update(id, shape)
  }

  async delete(id: number): Promise<Shape | undefined> {
    // Business logic: check if shape has designs before deleting
    return this.shapeRepository.delete(id)
  }
}

// ─────────────────────────────────────────────────────────────
// Design Image Service
// ─────────────────────────────────────────────────────────────

export class DesignImageService {
  constructor(private readonly designImageRepository: DesignImageRepository) {}

  async create(image: typeof designImages.$inferInsert): Promise<DesignImage> {
    // Business logic: validate design exists, URL format, etc.
    if (!image.publicUrl || !image.designId) {
      throw new Error('Image URL and design ID are required')
    }

    return this.designImageRepository.create(image)
  }

  async findByDesign(designId: number): Promise<DesignImage[]> {
    return this.designImageRepository.findByDesign(designId)
  }

  async findByCollection(collectionId: number): Promise<DesignImage[]> {
    return this.designImageRepository.findByCollection(collectionId)
  }

  async findPrimary(designId: number): Promise<DesignImage | undefined> {
    return this.designImageRepository.findPrimary(designId)
  }

  async findById(id: number): Promise<DesignImage | undefined> {
    return this.designImageRepository.findById(id)
  }

  async update(id: number, image: Partial<typeof designImages.$inferInsert>): Promise<DesignImage | undefined> {
    return this.designImageRepository.update(id, image)
  }

  async delete(id: number): Promise<boolean> {
    return this.designImageRepository.delete(id)
  }

  async deleteByDesign(designId: number): Promise<void> {
    return this.designImageRepository.deleteByDesign(designId)
  }

  async deleteByCollection(collectionId: number): Promise<void> {
    return this.designImageRepository.deleteByCollection(collectionId)
  }

  async reorder(designId: number, imageIds: number[]): Promise<void> {
    return this.designImageRepository.reorder(designId, imageIds)
  }

  async setPrimary(imageId: number): Promise<void> {
    return this.designImageRepository.setPrimary(imageId)
  }
}

// ─────────────────────────────────────────────────────────────
// Collection Image Service
// ─────────────────────────────────────────────────────────────

export class CollectionImageService {
  constructor(private readonly collectionImageRepository: CollectionImageRepository) {}

  async create(image: typeof collectionImages.$inferInsert): Promise<CollectionImage> {
    // Business logic: validate collection exists, URL format, etc.
    if (!image.imageUrl || !image.collectionId) {
      throw new Error('Image URL and collection ID are required')
    }

    return this.collectionImageRepository.create(image)
  }

  async findByCollection(collectionId: number): Promise<CollectionImage[]> {
    return this.collectionImageRepository.findByCollection(collectionId)
  }

  async findPrimary(collectionId: number): Promise<CollectionImage | undefined> {
    return this.collectionImageRepository.findPrimary(collectionId)
  }

  async findById(id: number): Promise<CollectionImage | undefined> {
    return this.collectionImageRepository.findById(id)
  }

  async update(id: number, image: Partial<typeof collectionImages.$inferInsert>): Promise<CollectionImage | undefined> {
    return this.collectionImageRepository.update(id, image)
  }

  async delete(id: number): Promise<boolean> {
    return this.collectionImageRepository.delete(id)
  }

  async deleteByCollection(collectionId: number): Promise<void> {
    return this.collectionImageRepository.deleteByCollection(collectionId)
  }

  async reorder(collectionId: number, imageIds: number[]): Promise<void> {
    return this.collectionImageRepository.reorder(collectionId, imageIds)
  }

  async setPrimary(imageId: number): Promise<void> {
    return this.collectionImageRepository.setPrimary(imageId)
  }
}

// ─────────────────────────────────────────────────────────────
// Shape Image Service
// ─────────────────────────────────────────────────────────────

export class ShapeImageService {
  constructor(private readonly shapeImageRepository: ShapeImageRepository) {}

  async create(image: typeof shapeImages.$inferInsert): Promise<ShapeImage> {
    // Business logic: validate shape exists, URL format, etc.
    if (!image.imageUrl || !image.shapeId) {
      throw new Error('Image URL and shape ID are required')
    }

    return this.shapeImageRepository.create(image)
  }

  async findByShape(shapeId: number): Promise<ShapeImage[]> {
    return this.shapeImageRepository.findByShape(shapeId)
  }

  async findPrimary(shapeId: number): Promise<ShapeImage | undefined> {
    return this.shapeImageRepository.findPrimary(shapeId)
  }

  async findById(id: number): Promise<ShapeImage | undefined> {
    return this.shapeImageRepository.findById(id)
  }

  async update(id: number, image: Partial<typeof shapeImages.$inferInsert>): Promise<ShapeImage | undefined> {
    return this.shapeImageRepository.update(id, image)
  }

  async delete(id: number): Promise<boolean> {
    return this.shapeImageRepository.delete(id)
  }

  async deleteByShape(shapeId: number): Promise<void> {
    return this.shapeImageRepository.deleteByShape(shapeId)
  }

  async reorder(shapeId: number, imageIds: number[]): Promise<void> {
    return this.shapeImageRepository.reorder(shapeId, imageIds)
  }

  async setPrimary(imageId: number): Promise<void> {
    return this.shapeImageRepository.setPrimary(imageId)
  }
}