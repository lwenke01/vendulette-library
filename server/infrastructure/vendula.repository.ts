import { eq } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '../../database/schema'
import type { Collection, Design, Shape } from '../../database/schema/vendula'

const collections = schema.collections
const designs = schema.designs
const shapes = schema.shapes

export interface CollectionRepository {
  create(collection: typeof collections.$inferInsert): Promise<Collection>
  findAll(): Promise<Collection[]>
  findById(id: number): Promise<Collection | undefined>
  delete(id: number): Promise<Collection>
}

export interface DesignRepository {
  create(design: typeof designs.$inferInsert): Promise<Design>
  findAll(): Promise<Design[]>
  findById(id: number): Promise<Design | undefined>
  delete(id: number): Promise<Design>
}

export interface ShapeRepository {
  create(shape: typeof shapes.$inferInsert): Promise<Shape>
  findAll(): Promise<Shape[]>
  findById(id: number): Promise<Shape | undefined>
  delete(id: number): Promise<Shape>
}

export class D1CollectionRepository implements CollectionRepository {
  constructor(private readonly db: DrizzleD1Database<typeof schema>) {}

  async create(collection: typeof collections.$inferInsert): Promise<Collection> {
    const result = await this.db.insert(collections).values(collection).returning()
    return result[0]
  }

  async findAll(): Promise<Collection[]> {
    const result = await this.db.select().from(collections).orderBy(schema.collections.sort_order)
    return result
  }

  async findById(id: number): Promise<Collection | undefined> {
    const result = await this.db.select().from(collections).where(eq(collections.id, id))
    return result[0]
  }

  async delete(id: number): Promise<Collection> {
    const result = await this.db.delete(collections).where(eq(collections.id, id)).returning()
    return result[0]
  }
}

export class D1DesignRepository implements DesignRepository {
  constructor(private readonly db: DrizzleD1Database<typeof schema>) {}

  async create(design: typeof designs.$inferInsert): Promise<Design> {
    const result = await this.db.insert(designs).values(design).returning()
    return result[0]
  }

  async findAll(): Promise<Design[]> {
    const result = await this.db.select().from(designs)
    return result
  }

  async findById(id: number): Promise<Design | undefined> {
    const result = await this.db.select().from(designs).where(eq(designs.id, id))
    return result[0]
  }

  async delete(id: number): Promise<Design> {
    const result = await this.db.delete(designs).where(eq(designs.id, id)).returning()
    return result[0]
  }
}

export class D1ShapeRepository implements ShapeRepository {
  constructor(private readonly db: DrizzleD1Database<typeof schema>) {}

  async create(shape: typeof shapes.$inferInsert): Promise<Shape> {
    const result = await this.db.insert(shapes).values(shape).returning()
    return result[0]
  }

  async findAll(): Promise<Shape[]> {
    const result = await this.db.select().from(shapes).orderBy(schema.shapes.name)
    return result
  }

  async findById(id: number): Promise<Shape | undefined> {
    const result = await this.db.select().from(shapes).where(eq(shapes.id, id))
    return result[0]
  }

  async delete(id: number): Promise<Shape> {
    const result = await this.db.delete(shapes).where(eq(shapes.id, id)).returning()
    return result[0]
  }
}