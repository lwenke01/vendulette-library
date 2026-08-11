import type { collections, designs, shapes } from '../../database/schema'
import type { Collection, Design, Shape } from '../../database/schema/vendula'
import type { CollectionRepository, DesignRepository, ShapeRepository } from '../infrastructure/vendula.repository'

export class CollectionService {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async create(collection: typeof collections.$inferInsert): Promise<Collection> {
    // Add business logic here (validation, transformation, etc.)
    return this.collectionRepository.create(collection)
  }

  async findAll(): Promise<Collection[]> {
    // Add business logic here (validation, transformation, etc.)
    return this.collectionRepository.findAll()
  }

  async findById(id: number): Promise<Collection | undefined> {
    return this.collectionRepository.findById(id)
  }

  async delete(id: number): Promise<Collection> {
    // Add business logic here (validation, transformation, etc.)
    return this.collectionRepository.delete(id)
  }
}

export class DesignService {
  constructor(private readonly designRepository: DesignRepository) {}

  async create(design: typeof designs.$inferInsert): Promise<Design> {
    // Add business logic here (validation, transformation, etc.)
    return this.designRepository.create(design)
  }

  async findAll(): Promise<Design[]> {
    // Add business logic here (validation, transformation, etc.)
    return this.designRepository.findAll()
  }

  async findById(id: number): Promise<Design | undefined> {
    return this.designRepository.findById(id)
  }

  async delete(id: number): Promise<Design> {
    // Add business logic here (validation, transformation, etc.)
    return this.designRepository.delete(id)
  }
}

export class ShapeService {
  constructor(private readonly shapeRepository: ShapeRepository) {}

  async create(shape: typeof shapes.$inferInsert): Promise<Shape> {
    // Add business logic here (validation, transformation, etc.)
    return this.shapeRepository.create(shape)
  }

  async findAll(): Promise<Shape[]> {
    // Add business logic here (validation, transformation, etc.)
    return this.shapeRepository.findAll()
  }

  async findById(id: number): Promise<Shape | undefined> {
    return this.shapeRepository.findById(id)
  }

  async delete(id: number): Promise<Shape> {
    // Add business logic here (validation, transformation, etc.)
    return this.shapeRepository.delete(id)
  }
}