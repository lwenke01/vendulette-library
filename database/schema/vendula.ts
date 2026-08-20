import { type InferSelectModel } from 'drizzle-orm'
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'

// ─────────────────────────────────────────────────────────────
// Collections
// ─────────────────────────────────────────────────────────────
export const collections = sqliteTable('Collections', {
  id: integer('id').primaryKey({ mode: 'autoincrement' }),
  name: text('name').notNull(),
  description: text('description'),
  season: text('season'),
  series: text('series'),
  edition: text('edition'),
  release_year: integer('release_year'),
  themes: text('themes'),
  colours: text('colours'),
  name_friendly: text('name_friendly'),
  type: text('type'),
  image_urls: text('image_urls'),
  releaseDate: text('releaseDate'),
  exclusive: text('exclusive'),
  isComplete: integer('isComplete').notNull().default(0),
  last_updated_at: text('last_updated_at'),
  link: text('link'),
  inLookbook: integer('inLookbook').notNull().default(1),
  sort_order: integer('sort_order'),
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
  name_friendly: text('name_friendly'),
  size: text('size'),
  description: text('description'),
  last_updated_at: text('last_updated_at'),
  intro_season: text('intro_season'),
  intro_collection: text('intro_collection'),
});

export type Shape = InferSelectModel<typeof shapes>
export const shapeInsertSchema = createInsertSchema(shapes)

// ─────────────────────────────────────────────────────────────
// Designs
// ─────────────────────────────────────────────────────────────
export const designs = sqliteTable('Designs', {
  id: integer('id').primaryKey({ mode: 'autoincrement' }),
  
  // Foreign keys
  collection_id: integer('collection_id')
    .notNull()
    .references(() => collections.id, { onDelete: 'cascade' }),
  shape_id: integer('shape_id')
    .references(() => shapes.id, { onDelete: 'set null' }),
  
  // Core identity
  name: text('name').notNull(),
  description: text('description'),
  image_urls: text('image_urls'),
  
  // Pricing
  price: real('price'),
  currency: text('currency').default('GBP'),
  
  // Shape overrides
  shape_name_overwrite: text('shape_name_overwrite'),
  shape_measurements_overwrite: text('shape_measurements_overwrite'),
  shape_size_overwrite: text('shape_size_overwrite'),
  shape_details_overwrite: text('shape_details_overwrite'),
  
  // Design-specific attributes
  exclusive_design: text('exclusive_design'),
  main_colour: text('main_colour'),
  
  // Product references
  product_id: text('product_id'),
  sku: text('sku'),
  
  // Categorization
  season: text('season'),
  product_category: text('product_category'),
  
  // Audit
  last_updated_at: text('last_updated_at'),
});

export type Design = InferSelectModel<typeof designs>
export const designInsertSchema = createInsertSchema(designs)

// ─────────────────────────────────────────────────────────────
// DesignImages (new table for normalized image storage)
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

