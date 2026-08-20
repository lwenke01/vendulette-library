import { eq, desc, asc } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '../../database/schema'
import type { Collection, Design, Shape, Season, DesignImage, CollectionImage, ShapeImage } from '../../database/schema'

const collections = schema.collections
const designs = schema.designs
const shapes = schema.shapes
const seasons = schema.seasons
const designImages = schema.designImages
const collectionImages = schema.collectionImages
const shapeImages = schema.shapeImages

// ─────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────

export interface SeasonRepository {
  create(season: typeof seasons.$inferInsert): Promise<Season>
  findAll(): Promise<Season[]>
  findById(id: number): Promise<Season | undefined>
  findByYear(year: number): Promise<Season[]>
  findCurrent(): Promise<Season | undefined>
  update(id: number, season: Partial<typeof seasons.$inferInsert>): Promise<Season | undefined>
  delete(id: number): Promise<Season | undefined>
  reorder(seasonIds: number[]): Promise<void>
}

export interface CollectionRepository {
  create(collection: typeof collections.$inferInsert): Promise<Collection>
  findAll(): Promise<Collection[]>
  findById(id: number): Promise<Collection | undefined>
  findBySeason(seasonId: number): Promise<Collection[]>
  findByYear(year: number): Promise<Collection[]>
  update(id: number, collection: Partial<typeof collections.$inferInsert>): Promise<Collection | undefined>
  delete(id: number): Promise<Collection | undefined>
}

export interface DesignRepository {
  create(design: typeof designs.$inferInsert): Promise<Design>
  findAll(): Promise<Design[]>
  findById(id: number): Promise<Design | undefined>
  findByCollection(collectionId: number): Promise<Design[]>
  findByShape(shapeId: number): Promise<Design[]>
  update(id: number, design: Partial<typeof designs.$inferInsert>): Promise<Design | undefined>
  delete(id: number): Promise<Design | undefined>
  deleteByCollection(collectionId: number): Promise<void>
}

export interface ShapeRepository {
  create(shape: typeof shapes.$inferInsert): Promise<Shape>
  findAll(): Promise<Shape[]>
  findById(id: number): Promise<Shape | undefined>
  update(id: number, shape: Partial<typeof shapes.$inferInsert>): Promise<Shape | undefined>
  delete(id: number): Promise<Shape | undefined>
}

export interface DesignImageRepository {
  create(image: typeof designImages.$inferInsert): Promise<DesignImage>
  findByDesign(designId: number): Promise<DesignImage[]>
  findByCollection(collectionId: number): Promise<DesignImage[]>
  findPrimary(designId: number): Promise<DesignImage | undefined>
  findById(id: number): Promise<DesignImage | undefined>
  update(id: number, image: Partial<typeof designImages.$inferInsert>): Promise<DesignImage | undefined>
  delete(id: number): Promise<boolean>
  deleteByDesign(designId: number): Promise<void>
  deleteByCollection(collectionId: number): Promise<void>
  reorder(designId: number, imageIds: number[]): Promise<void>
  setPrimary(imageId: number): Promise<void>
}

export interface CollectionImageRepository {
  create(image: typeof collectionImages.$inferInsert): Promise<CollectionImage>
  findByCollection(collectionId: number): Promise<CollectionImage[]>
  findPrimary(collectionId: number): Promise<CollectionImage | undefined>
  findById(id: number): Promise<CollectionImage | undefined>
  update(id: number, image: Partial<typeof collectionImages.$inferInsert>): Promise<CollectionImage | undefined>
  delete(id: number): Promise<boolean>
  deleteByCollection(collectionId: number): Promise<void>
  reorder(collectionId: number, imageIds: number[]): Promise<void>
  setPrimary(imageId: number): Promise<void>
}

export interface ShapeImageRepository {
  create(image: typeof shapeImages.$inferInsert): Promise<ShapeImage>
  findByShape(shapeId: number): Promise<ShapeImage[]>
  findPrimary(shapeId: number): Promise<ShapeImage | undefined>
  findById(id: number): Promise<ShapeImage | undefined>
  update(id: number, image: Partial<typeof shapeImages.$inferInsert>): Promise<ShapeImage | undefined>
  delete(id: number): Promise<boolean>
  deleteByShape(shapeId: number): Promise<void>
  reorder(shapeId: number, imageIds: number[]): Promise<void>
  setPrimary(imageId: number): Promise<void>
}

// ─────────────────────────────────────────────────────────────
// Season Repository
// ─────────────────────────────────────────────────────────────

export class D1SeasonRepository implements SeasonRepository {
  constructor(private readonly db: DrizzleD1Database<typeof schema>) {}

  async create(season: typeof seasons.$inferInsert): Promise<Season> {
    const result = await this.db.insert(seasons).values(season).returning()
    return result[0]
  }

  async findAll(): Promise<Season[]> {
    const result = await this.db
      .select()
      .from(seasons)
      .orderBy(desc(seasons.sortOrder), desc(seasons.year), asc(seasons.name))
    return result
  }

  async findById(id: number): Promise<Season | undefined> {
    const result = await this.db.select().from(seasons).where(eq(seasons.id, id))
    return result[0]
  }

  async findByYear(year: number): Promise<Season[]> {
    const result = await this.db
      .select()
      .from(seasons)
      .where(eq(seasons.year, year))
      .orderBy(desc(seasons.sortOrder), asc(seasons.name))
    return result
  }

  async findCurrent(): Promise<Season | undefined> {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const result = await this.db
      .select()
      .from(seasons)
      .where(
        eq(seasons.seasonStartDate, now) || 
        (eq(seasons.seasonStartDate, null) && eq(seasons.seasonEndDate, null))
      )
      .orderBy(desc(seasons.sortOrder))
      .limit(1)
    return result[0]
  }

  async update(id: number, season: Partial<typeof seasons.$inferInsert>): Promise<Season | undefined> {
    const result = await this.db
      .update(seasons)
      .set({ ...season, updatedAt: new Date().toISOString() })
      .where(eq(seasons.id, id))
      .returning()
    return result[0]
  }

  async delete(id: number): Promise<Season | undefined> {
    const result = await this.db.delete(seasons).where(eq(seasons.id, id)).returning()
    return result[0]
  }

  async reorder(seasonIds: number[]): Promise<void> {
    const updates = seasonIds.map((id, index) => {
      const sortOrder = seasonIds.length - index
      return this.db
        .update(seasons)
        .set({ sortOrder, updatedAt: new Date().toISOString() })
        .where(eq(seasons.id, id))
    })
    await Promise.all(updates)
  }
}

// ─────────────────────────────────────────────────────────────
// Collection Repository
// ─────────────────────────────────────────────────────────────

export class D1CollectionRepository implements CollectionRepository {
  constructor(private readonly db: DrizzleD1Database<typeof schema>) {}

  async create(collection: typeof collections.$inferInsert): Promise<Collection> {
    const result = await this.db.insert(collections).values(collection).returning()
    return result[0]
  }

  async findAll(): Promise<Collection[]> {
    const result = await this.db
      .select()
      .from(collections)
      .orderBy(asc(collections.sortOrder), desc(collections.releaseYear), asc(collections.name))
    return result
  }

  async findById(id: number): Promise<Collection | undefined> {
    const result = await this.db.select().from(collections).where(eq(collections.id, id))
    return result[0]
  }

  async findBySeason(seasonId: number): Promise<Collection[]> {
    const result = await this.db
      .select()
      .from(collections)
      .where(eq(collections.seasonId, seasonId))
      .orderBy(asc(collections.sortOrder), asc(collections.name))
    return result
  }

  async findByYear(year: number): Promise<Collection[]> {
    const result = await this.db
      .select()
      .from(collections)
      .where(eq(collections.releaseYear, year))
      .orderBy(asc(collections.sortOrder), asc(collections.name))
    return result
  }

  async update(id: number, collection: Partial<typeof collections.$inferInsert>): Promise<Collection | undefined> {
    const result = await this.db
      .update(collections)
      .set({ ...collection, updatedAt: new Date().toISOString() })
      .where(eq(collections.id, id))
      .returning()
    return result[0]
  }

  async delete(id: number): Promise<Collection | undefined> {
    const result = await this.db.delete(collections).where(eq(collections.id, id)).returning()
    return result[0]
  }
}

// ─────────────────────────────────────────────────────────────
// Design Repository
// ─────────────────────────────────────────────────────────────

export class D1DesignRepository implements DesignRepository {
  constructor(private readonly db: DrizzleD1Database<typeof schema>) {}

  async create(design: typeof designs.$inferInsert): Promise<Design> {
    const result = await this.db.insert(designs).values(design).returning()
    return result[0]
  }

  async findAll(): Promise<Design[]> {
    const result = await this.db.select().from(designs).orderBy(asc(designs.name))
    return result
  }

  async findById(id: number): Promise<Design | undefined> {
    const result = await this.db.select().from(designs).where(eq(designs.id, id))
    return result[0]
  }

  async findByCollection(collectionId: number): Promise<Design[]> {
    const result = await this.db
      .select()
      .from(designs)
      .where(eq(designs.collectionId, collectionId))
      .orderBy(asc(designs.name))
    return result
  }

  async findByShape(shapeId: number): Promise<Design[]> {
    const result = await this.db
      .select()
      .from(designs)
      .where(eq(designs.shapeId, shapeId))
      .orderBy(asc(designs.name))
    return result
  }

  async update(id: number, design: Partial<typeof designs.$inferInsert>): Promise<Design | undefined> {
    const result = await this.db
      .update(designs)
      .set({ ...design, updatedAt: new Date().toISOString() })
      .where(eq(designs.id, id))
      .returning()
    return result[0]
  }

  async delete(id: number): Promise<Design | undefined> {
    const result = await this.db.delete(designs).where(eq(designs.id, id)).returning()
    return result[0]
  }

  async deleteByCollection(collectionId: number): Promise<void> {
    await this.db.delete(designs).where(eq(designs.collectionId, collectionId))
  }
}

// ─────────────────────────────────────────────────────────────
// Shape Repository
// ─────────────────────────────────────────────────────────────

export class D1ShapeRepository implements ShapeRepository {
  constructor(private readonly db: DrizzleD1Database<typeof schema>) {}

  async create(shape: typeof shapes.$inferInsert): Promise<Shape> {
    const result = await this.db.insert(shapes).values(shape).returning()
    return result[0]
  }

  async findAll(): Promise<Shape[]> {
    const result = await this.db.select().from(shapes).orderBy(asc(shapes.name))
    return result
  }

  async findById(id: number): Promise<Shape | undefined> {
    const result = await this.db.select().from(shapes).where(eq(shapes.id, id))
    return result[0]
  }

  async update(id: number, shape: Partial<typeof shapes.$inferInsert>): Promise<Shape | undefined> {
    const result = await this.db
      .update(shapes)
      .set({ ...shape, lastUpdatedAt: new Date().toISOString() })
      .where(eq(shapes.id, id))
      .returning()
    return result[0]
  }

  async delete(id: number): Promise<Shape | undefined> {
    const result = await this.db.delete(shapes).where(eq(shapes.id, id)).returning()
    return result[0]
  }
}

// ─────────────────────────────────────────────────────────────
// Design Image Repository
// ─────────────────────────────────────────────────────────────

export class D1DesignImageRepository implements DesignImageRepository {
  constructor(private readonly db: DrizzleD1Database<typeof schema>) {}

  async create(image: typeof designImages.$inferInsert): Promise<DesignImage> {
    // If setting as primary, unset other primaries
    if (image.isPrimary) {
      await this.db
        .update(designImages)
        .set({ isPrimary: 0 })
        .where(eq(designImages.designId, image.designId))
    }

    const result = await this.db.insert(designImages).values(image).returning()
    return result[0]
  }

  async findByDesign(designId: number): Promise<DesignImage[]> {
    const result = await this.db
      .select()
      .from(designImages)
      .where(eq(designImages.designId, designId))
      .orderBy(asc(designImages.sortOrder), asc(designImages.id))
    return result
  }

  async findByCollection(collectionId: number): Promise<DesignImage[]> {
    const result = await this.db
      .select()
      .from(designImages)
      .where(eq(designImages.collectionId, collectionId))
      .orderBy(asc(designImages.designId), asc(designImages.sortOrder))
    return result
  }

  async findPrimary(designId: number): Promise<DesignImage | undefined> {
    const result = await this.db
      .select()
      .from(designImages)
      .where(eq(designImages.designId, designId), eq(designImages.isPrimary, 1))
      .orderBy(asc(designImages.sortOrder))
      .limit(1)
    return result[0]
  }

  async findById(id: number): Promise<DesignImage | undefined> {
    const result = await this.db.select().from(designImages).where(eq(designImages.id, id))
    return result[0]
  }

  async update(id: number, image: Partial<typeof designImages.$inferInsert>): Promise<DesignImage | undefined> {
    const existing = await this.findById(id)
    if (!existing) return undefined

    // If setting as primary, unset other primaries
    if (image.isPrimary) {
      await this.db
        .update(designImages)
        .set({ isPrimary: 0 })
        .where(eq(designImages.designId, existing.designId))
    }

    const result = await this.db
      .update(designImages)
      .set(image)
      .where(eq(designImages.id, id))
      .returning()
    return result[0]
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(designImages).where(eq(designImages.id, id)).returning()
    return result.length > 0
  }

  async deleteByDesign(designId: number): Promise<void> {
    await this.db.delete(designImages).where(eq(designImages.designId, designId))
  }

  async deleteByCollection(collectionId: number): Promise<void> {
    await this.db.delete(designImages).where(eq(designImages.collectionId, collectionId))
  }

  async reorder(designId: number, imageIds: number[]): Promise<void> {
    const updates = imageIds.map((id, index) =>
      this.db
        .update(designImages)
        .set({ sortOrder: index })
        .where(eq(designImages.id, id), eq(designImages.designId, designId))
    )
    await Promise.all(updates)
  }

  async setPrimary(imageId: number): Promise<void> {
    const image = await this.findById(imageId)
    if (!image) return

    await this.db
      .update(designImages)
      .set({ isPrimary: 0 })
      .where(eq(designImages.designId, image.designId))

    await this.db
      .update(designImages)
      .set({ isPrimary: 1 })
      .where(eq(designImages.id, imageId))
  }
}

// ─────────────────────────────────────────────────────────────
// Collection Image Repository
// ─────────────────────────────────────────────────────────────

export class D1CollectionImageRepository implements CollectionImageRepository {
  constructor(private readonly db: DrizzleD1Database<typeof schema>) {}

  async create(image: typeof collectionImages.$inferInsert): Promise<CollectionImage> {
    // If setting as primary, unset other primaries
    if (image.isPrimary) {
      await this.db
        .update(collectionImages)
        .set({ isPrimary: 0 })
        .where(eq(collectionImages.collectionId, image.collectionId))
    }

    const result = await this.db.insert(collectionImages).values(image).returning()
    return result[0]
  }

  async findByCollection(collectionId: number): Promise<CollectionImage[]> {
    const result = await this.db
      .select()
      .from(collectionImages)
      .where(eq(collectionImages.collectionId, collectionId))
      .orderBy(asc(collectionImages.sortOrder), asc(collectionImages.id))
    return result
  }

  async findPrimary(collectionId: number): Promise<CollectionImage | undefined> {
    const result = await this.db
      .select()
      .from(collectionImages)
      .where(eq(collectionImages.collectionId, collectionId), eq(collectionImages.isPrimary, 1))
      .orderBy(asc(collectionImages.sortOrder))
      .limit(1)
    return result[0]
  }

  async findById(id: number): Promise<CollectionImage | undefined> {
    const result = await this.db.select().from(collectionImages).where(eq(collectionImages.id, id))
    return result[0]
  }

  async update(id: number, image: Partial<typeof collectionImages.$inferInsert>): Promise<CollectionImage | undefined> {
    const existing = await this.findById(id)
    if (!existing) return undefined

    // If setting as primary, unset other primaries
    if (image.isPrimary) {
      await this.db
        .update(collectionImages)
        .set({ isPrimary: 0 })
        .where(eq(collectionImages.collectionId, existing.collectionId))
    }

    const result = await this.db
      .update(collectionImages)
      .set({ ...image, updatedAt: new Date().toISOString() })
      .where(eq(collectionImages.id, id))
      .returning()
    return result[0]
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(collectionImages).where(eq(collectionImages.id, id)).returning()
    return result.length > 0
  }

  async deleteByCollection(collectionId: number): Promise<void> {
    await this.db.delete(collectionImages).where(eq(collectionImages.collectionId, collectionId))
  }

  async reorder(collectionId: number, imageIds: number[]): Promise<void> {
    const updates = imageIds.map((id, index) =>
      this.db
        .update(collectionImages)
        .set({ sortOrder: index, updatedAt: new Date().toISOString() })
        .where(eq(collectionImages.id, id), eq(collectionImages.collectionId, collectionId))
    )
    await Promise.all(updates)
  }

  async setPrimary(imageId: number): Promise<void> {
    const image = await this.findById(imageId)
    if (!image) return

    await this.db
      .update(collectionImages)
      .set({ isPrimary: 0 })
      .where(eq(collectionImages.collectionId, image.collectionId))

    await this.db
      .update(collectionImages)
      .set({ isPrimary: 1 })
      .where(eq(collectionImages.id, imageId))
  }
}

// ─────────────────────────────────────────────────────────────
// Shape Image Repository
// ─────────────────────────────────────────────────────────────

export class D1ShapeImageRepository implements ShapeImageRepository {
  constructor(private readonly db: DrizzleD1Database<typeof schema>) {}

  async create(image: typeof shapeImages.$inferInsert): Promise<ShapeImage> {
    // If setting as primary, unset other primaries
    if (image.isPrimary) {
      await this.db
        .update(shapeImages)
        .set({ isPrimary: 0 })
        .where(eq(shapeImages.shapeId, image.shapeId))
    }

    const result = await this.db.insert(shapeImages).values(image).returning()
    return result[0]
  }

  async findByShape(shapeId: number): Promise<ShapeImage[]> {
    const result = await this.db
      .select()
      .from(shapeImages)
      .where(eq(shapeImages.shapeId, shapeId))
      .orderBy(asc(shapeImages.sortOrder), asc(shapeImages.id))
    return result
  }

  async findPrimary(shapeId: number): Promise<ShapeImage | undefined> {
    const result = await this.db
      .select()
      .from(shapeImages)
      .where(eq(shapeImages.shapeId, shapeId), eq(shapeImages.isPrimary, 1))
      .orderBy(asc(shapeImages.sortOrder))
      .limit(1)
    return result[0]
  }

  async findById(id: number): Promise<ShapeImage | undefined> {
    const result = await this.db.select().from(shapeImages).where(eq(shapeImages.id, id))
    return result[0]
  }

  async update(id: number, image: Partial<typeof shapeImages.$inferInsert>): Promise<ShapeImage | undefined> {
    const existing = await this.findById(id)
    if (!existing) return undefined

    // If setting as primary, unset other primaries
    if (image.isPrimary) {
      await this.db
        .update(shapeImages)
        .set({ isPrimary: 0 })
        .where(eq(shapeImages.shapeId, existing.shapeId))
    }

    const result = await this.db
      .update(shapeImages)
      .set({ ...image, updatedAt: new Date().toISOString() })
      .where(eq(shapeImages.id, id))
      .returning()
    return result[0]
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(shapeImages).where(eq(shapeImages.id, id)).returning()
    return result.length > 0
  }

  async deleteByShape(shapeId: number): Promise<void> {
    await this.db.delete(shapeImages).where(eq(shapeImages.shapeId, shapeId))
  }

  async reorder(shapeId: number, imageIds: number[]): Promise<void> {
    const updates = imageIds.map((id, index) =>
      this.db
        .update(shapeImages)
        .set({ sortOrder: index, updatedAt: new Date().toISOString() })
        .where(eq(shapeImages.id, id), eq(shapeImages.shapeId, shapeId))
    )
    await Promise.all(updates)
  }

  async setPrimary(imageId: number): Promise<void> {
    const image = await this.findById(imageId)
    if (!image) return

    await this.db
      .update(shapeImages)
      .set({ isPrimary: 0 })
      .where(eq(shapeImages.shapeId, image.shapeId))

    await this.db
      .update(shapeImages)
      .set({ isPrimary: 1 })
      .where(eq(shapeImages.id, imageId))
  }
}