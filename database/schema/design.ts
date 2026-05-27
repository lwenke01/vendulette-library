import { type InferSelectModel } from 'drizzle-orm'
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'
import { collections } from './collection'
import { shapes } from './shape'

export const designs = sqliteTable('Designs', {
  id: integer('id').primaryKey({ mode: 'autoincrement' }),
  collectionId: integer('collection_id')
    .notNull()
    .references(() => collections.id, { onDelete: 'cascade' }),
  shapeId: integer('shape_id').references(() => shapes.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  imageUrls: text('image_urls'),
  price: real('price'),
  shape_name_overwrite: text('shape_name_overwrite'),
  shape_measurements_overwrite: text('shape_measurements_overwrite'),
  shape_size_overwrite: text('hape_size_overwrite'),
  shape_details_overwrite: text('shape_details_overwrite'),
  exclusive_design: text('exclusive_design'),
  main_colour: text('main_colour'),
  product_id: text('product_id'),
  sku: text('sku'),
  last_updated_at: text('last_updated_at'),

})



export type Design = InferSelectModel<typeof designs>
export const designInsertSchema = createInsertSchema(designs)
