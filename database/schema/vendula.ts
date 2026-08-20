import { type InferSelectModel } from 'drizzle-orm'
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'

// ─────────────────────────────────────────────────────────────
// Seasons
// ─────────────────────────────────────────────────────────────
export const seasons = sqliteTable('seasons', {
  id: integer('id').primaryKey({ mode: 'autoincrement' }),
  name: text('name').notNull().unique(),
  year: integer('year').notNull(),
  sortOrder: integer('sort_order').default(0),
  images: text('images'),  // JSON array
  lookbookImages: text('lookbook_images'),  // JSON array
  lookbookReleaseDate: text('lookbook_release_date'),
  seasonStartDate: text('season_start_date'),
  seasonEndDate: text('season_end_date'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export type Season = InferSelectModel<typeof seasons>
export const seasonInsertSchema = createInsertSchema(seasons)

// ─────────────────────────────────────────────────────────────
// Collections
// ─────────────────────────────────────────────────────────────
export const collections = sqliteTable('Collections', {
  id: integer('id').primaryKey({ mode: 'autoincrement' }),
  name: text('name').notNull(),
  nameFriendly: text('name_friendly'),
  type: text('type'),
  description: text('description'),
  season: text('season'),
  series: text('series'),
  edition: text('edition'),
  releaseYear: integer('release_year'),
  releaseDate: text('releaseDate'),
  themes: text('themes'),
  colours: text('colours'),
  imageUrls: text('image_urls'),  // JSON array
  exclusive: text('exclusive'),
  link: text('link'),
  mainAnimal: text('main_animal'),
  seasonId: integer('season_id')
    .references(() => seasons.id, { onDelete: 'set null' }),
  isComplete: integer('isComplete').notNull().default(0),
  inLookbook: integer('inLookbook').notNull().default(1),
  sortOrder: integer('sort_order'),
  lastUpdatedAt: text('last_updated_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export type Collection = InferSelectModel<typeof collections>
export const collectionInsertSchema = createInsertSchema(collections)

// ─────────────────────────────────────────────────────────────
// Shapes
// ─────────────────────────────────────────────────────────────
export const shapes = sqliteTable('Shapes', {
  id: integer('id').primaryKey({ mode: 'autoincrement' }),
  name: text('name').notNull().unique(),
  measurements: text('measurements'),
  category: text('category'),
  nameFriendly: text('name_friendly'),
  size: text('size'),
  description: text('description'),
  lastUpdatedAt: text('last_updated_at'),
  introSeason: text('intro_season'),
  introCollection: text('intro_collection'),
});

export type Shape = InferSelectModel<typeof shapes>
export const shapeInsertSchema = createInsertSchema(shapes)

// ─────────────────────────────────────────────────────────────
// Designs
// ─────────────────────────────────────────────────────────────
export const designs = sqliteTable('Designs', {
  id: integer('id').primaryKey({ mode: 'autoincrement' }),
  
  // Foreign keys
  collectionId: integer('collection_id')
    .notNull()
    .references(() => collections.id, { onDelete: 'cascade' }),
  shapeId: integer('shape_id')
    .references(() => shapes.id, { onDelete: 'set null' }),
  
  // Core identity
  name: text('name').notNull(),
  description: text('description'),
  imageUrls: text('image_urls'),  // JSON array
  
  // Pricing
  price: real('price'),
  currency: text('currency').default('GBP'),
  
  // Shape overrides
  shapeNameOverwrite: text('shape_name_overwrite'),
  shapeMeasurementsOverwrite: text('shape_measurements_overwrite'),
  shapeSizeOverwrite: text('shape_size_overwrite'),
  shapeDetailsOverwrite: text('shape_details_overwrite'),
  
  // Design-specific attributes
  exclusiveDesign: text('exclusive_design'),
  mainColour: text('main_colour'),
  
  // Product references
  productId: text('product_id'),
  sku: text('sku'),
  
  // Categorization
  season: text('season'),
  productCategory: text('product_category'),
  
  // Audit
  lastMigratedAt: text('last_migrated_at'),
  lastUpdatedAt: text('last_updated_at'),
  updatedAt: text('updated_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export type Design = InferSelectModel<typeof designs>
export const designInsertSchema = createInsertSchema(designs)

// ─────────────────────────────────────────────────────────────
// DesignImages (normalized image storage)
// ─────────────────────────────────────────────────────────────
export const designImages = sqliteTable('DesignImages', {
  id: integer('id').primaryKey({ mode: 'autoincrement' }),
  season: text('season'),
  collectionId: integer('collection_id')
    .notNull()
    .references(() => collections.id, { onDelete: 'cascade' }),
  designId: integer('design_id')
    .notNull()
    .references(() => designs.id, { onDelete: 'cascade' }),
  storageKey: text('storage_key'),
  publicUrl: text('public_url').notNull(),
  altText: text('alt_text'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPrimary: integer('is_primary').notNull().default(0),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  bytes: integer('bytes'),
});

export type DesignImage = InferSelectModel<typeof designImages>
export const designImageInsertSchema = createInsertSchema(designImages)

// ─────────────────────────────────────────────────────────────
// CollectionImages (normalized image storage for collections)
// ─────────────────────────────────────────────────────────────
export const collectionImages = sqliteTable('CollectionImages', {
  id: integer('id').primaryKey({ mode: 'autoincrement' }),
  collectionId: integer('collection_id')
    .notNull()
    .references(() => collections.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  altText: text('alt_text'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPrimary: integer('is_primary').notNull().default(0),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
});

export type CollectionImage = InferSelectModel<typeof collectionImages>
export const collectionImageInsertSchema = createInsertSchema(collectionImages)

// ─────────────────────────────────────────────────────────────
// ShapeImages (normalized image storage for shapes)
// ─────────────────────────────────────────────────────────────
export const shapeImages = sqliteTable('ShapeImages', {
  id: integer('id').primaryKey({ mode: 'autoincrement' }),
  shapeId: integer('shape_id')
    .notNull()
    .references(() => shapes.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  altText: text('alt_text'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPrimary: integer('is_primary').notNull().default(0),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
});

export type ShapeImage = InferSelectModel<typeof shapeImages>
export const shapeImageInsertSchema = createInsertSchema(shapeImages)