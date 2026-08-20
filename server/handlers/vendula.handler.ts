import { createFactory } from 'hono/factory'

const F = createFactory()

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function safeJson(value: any, fallback: any[] = []) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function formatCollection(row: any) {
  return {
    ...row,
    themes: safeJson(row.themes, []),
    colours: safeJson(row.colours, []),
    imageUrls: safeJson(row.image_urls, []),
  }
}

function formatDesign(row: any) {
  let finalShapeName: string | null = null
  const shapeName = row.shape_name
  const shapeNameOverwrite = row.shape_name_overwrite

  if (shapeNameOverwrite) {
    finalShapeName = shapeNameOverwrite
      .toLowerCase()
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  } else if (shapeName && shapeName.toLowerCase() !== 'unknown') {
    finalShapeName = shapeName
  }

  return {
    ...row,
    shape_name: finalShapeName,
    measurements: row.measurements ?? row.shape_measurements_overwrite ?? null,
    size: row.shape_size_overwrite ?? row.shape_size ?? null,
    shape_category: row.shape_category ?? null,
    shape_desc: row.shape_desc ?? row.shape_details_overwrite ?? row.description ?? null,
    imageUrls: safeJson(row.image_urls, []),
  }
}

function parseLimit(raw: string | null) {
  let limit = parseInt(raw || '500', 10)
  if (!Number.isFinite(limit) || limit <= 0) limit = 500
  if (limit > 1000) limit = 1000
  return limit
}

// ─────────────────────────────────────────────────────────────
// Season Handlers
// ─────────────────────────────────────────────────────────────

export const seasonsGet = F.createHandlers(async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM seasons
    ORDER BY sort_order DESC, year DESC, name ASC
  `).all()

  return c.json(results.map((row: any) => ({
    ...row,
    images: safeJson(row.images, []),
    lookbookImages: safeJson(row.lookbook_images, []),
  })))
})

export const seasonByIdGet = F.createHandlers(async (c) => {
  const id = c.req.param('id')

  const season = await c.env.DB.prepare('SELECT * FROM seasons WHERE id = ?').bind(id).first()
  if (!season) return c.json({ error: 'Season not found' }, 404)

  return c.json({
    ...season,
    images: safeJson(season.images, []),
    lookbookImages: safeJson(season.lookbook_images, []),
  })
})

export const seasonByYearGet = F.createHandlers(async (c) => {
  const year = c.req.param('year')

  const { results } = await c.env.DB.prepare(`
    SELECT * FROM seasons
    WHERE year = ?
    ORDER BY sort_order DESC, name ASC
  `).bind(year).all()

  return c.json(results.map((row: any) => ({
    ...row,
    images: safeJson(row.images, []),
    lookbookImages: safeJson(row.lookbook_images, []),
  })))
})

export const seasonCurrentGet = F.createHandlers(async (c) => {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  const season = await c.env.DB.prepare(`
    SELECT * FROM seasons
    WHERE (season_start_date <= ? OR season_start_date IS NULL)
      AND (season_end_date >= ? OR season_end_date IS NULL)
    ORDER BY sort_order DESC
    LIMIT 1
  `).bind(now, now).first()

  if (!season) return c.json(null)

  return c.json({
    ...season,
    images: safeJson(season.images, []),
    lookbookImages: safeJson(season.lookbook_images, []),
  })
})

export const seasonPost = F.createHandlers(async (c) => {
  const {
    name,
    year,
    sort_order,
    images,
    lookbook_images,
    lookbook_release_date,
    season_start_date,
    season_end_date,
  } = await c.req.json()

  await c.env.DB.prepare(`
    INSERT INTO seasons (
      name, year, sort_order, images, lookbook_images,
      lookbook_release_date, season_start_date, season_end_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    name,
    year,
    sort_order ?? 0,
    images ? JSON.stringify(images) : null,
    lookbook_images ? JSON.stringify(lookbook_images) : null,
    lookbook_release_date ?? null,
    season_start_date ?? null,
    season_end_date ?? null
  ).run()

  return c.json({ success: true }, 201)
})

export const seasonPut = F.createHandlers(async (c) => {
  const id = c.req.param('id')
  const {
    name,
    year,
    sort_order,
    images,
    lookbook_images,
    lookbook_release_date,
    season_start_date,
    season_end_date,
  } = await c.req.json()

  await c.env.DB.prepare(`
    UPDATE seasons SET
      name = ?, year = ?, sort_order = ?,
      images = ?, lookbook_images = ?,
      lookbook_release_date = ?, season_start_date = ?, season_end_date = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    name ?? null,
    year ?? null,
    sort_order ?? null,
    images ? JSON.stringify(images) : null,
    lookbook_images ? JSON.stringify(lookbook_images) : null,
    lookbook_release_date ?? null,
    season_start_date ?? null,
    season_end_date ?? null,
    id
  ).run()

  return c.json({ success: true })
})

export const seasonDelete = F.createHandlers(async (c) => {
  const id = c.req.param('id')

  await c.env.DB.prepare('DELETE FROM seasons WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

export const seasonReorderPost = F.createHandlers(async (c) => {
  const { season_ids } = await c.req.json()

  if (!season_ids || !Array.isArray(season_ids)) {
    return c.json({ error: 'season_ids array is required' }, 400)
  }

  const updates = season_ids.map((id: number, index: number) => {
    const sortOrder = season_ids.length - index
    return c.env.DB.prepare(`
      UPDATE seasons SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(sortOrder, id).run()
  })

  await Promise.all(updates)
  return c.json({ success: true })
})

// ─────────────────────────────────────────────────────────────
// Collection Handlers
// ─────────────────────────────────────────────────────────────

export const vendulaCollectionsGet = F.createHandlers(async (c) => {
  const url = new URL(c.req.url)
  const q = (url.searchParams.get('q') || '').trim()
  const season = (url.searchParams.get('season') || '').trim()
  const limit = parseLimit(url.searchParams.get('limit'))

  const where: string[] = []
  const params: any[] = []

  if (season) {
    where.push('c.season = ?')
    params.push(season)
  }

  if (q) {
    where.push("(LOWER(c.name) LIKE '%' || LOWER(?) || '%' OR LOWER(c.description) LIKE '%' || LOWER(?) || '%')")
    params.push(q, q)
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''

  const sql = `
    SELECT c.*,
      COALESCE(
        (
          SELECT json_group_array(
            json_object(
              'id', d.id,
              'collection_id', d.collection_id,
              'shape_id', d.shape_id,
              'name', d.name,
              'description', d.description,
              'image_urls', d.image_urls,
              'price', d.price,
              'currency', d.currency,
              'shape_name_overwrite', d.shape_name_overwrite,
              'shape_measurements_overwrite', d.shape_measurements_overwrite,
              'shape_size_overwrite', d.shape_size_overwrite,
              'shape_details_overwrite', d.shape_details_overwrite,
              'exclusive_design', d.exclusive_design,
              'main_colour', d.main_colour,
              'product_id', d.product_id,
              'sku', d.sku,
              'season', d.season,
              'product_category', d.product_category
            )
          )
          FROM Designs AS d
          WHERE d.collection_id = c.id
        ),
        '[]'
      ) AS designs
    FROM Collections AS c
    ${whereClause}
    ORDER BY c.sort_order DESC, c.release_year DESC, c.name ASC
    LIMIT ${limit}
  `

  const { results } = await c.env.DB.prepare(sql).all(...params)

  const cleaned = results.map((row: any) => {
    const designs = safeJson(row.designs, [])
    return {
      ...formatCollection(row),
      designs: designs.map((design: any) => formatDesign(design)),
    }
  })

  return c.json(cleaned)
})

export const vendulaCollectionById = F.createHandlers(async (c) => {
  const id = c.req.param('id')

  const collection = await c.env.DB.prepare('SELECT * FROM Collections WHERE id = ?').bind(id).first()
  if (!collection) return c.json({ error: 'Collection not found' }, 404)

  const { results: designs } = await c.env.DB.prepare(`
    SELECT * FROM Designs WHERE collection_id = ? ORDER BY name ASC
  `).bind(id).all()

  return c.json({
    ...formatCollection(collection),
    designs: designs.map(formatDesign),
  })
})

export const vendulaCollectionsPost = F.createHandlers(async (c) => {
  const body = await c.req.json()
  const {
    name,
    name_friendly,
    type,
    description,
    season,
    series,
    edition,
    release_year,
    releaseDate,
    themes,
    colours,
    image_urls,
    exclusive,
    link,
    main_animal,
    season_id,
    isComplete,
    inLookbook,
    sort_order,
  } = body

  await c.env.DB.prepare(`
    INSERT INTO Collections (
      name, name_friendly, type, description, season, series, edition,
      release_year, releaseDate, themes, colours, image_urls, exclusive,
      link, main_animal, season_id, isComplete, inLookbook, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    name,
    name_friendly ?? null,
    type ?? null,
    description ?? null,
    season ?? null,
    series ?? null,
    edition ?? null,
    release_year ?? null,
    releaseDate ?? null,
    JSON.stringify(themes ?? []),
    JSON.stringify(colours ?? []),
    JSON.stringify(image_urls ?? []),
    exclusive ?? null,
    link ?? null,
    main_animal ?? null,
    season_id ?? null,
    isComplete ?? 0,
    inLookbook ?? 1,
    sort_order ?? null
  ).run()

  return c.json({ success: true }, 201)
})

export const vendulaCollectionsPut = F.createHandlers(async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const {
    name,
    name_friendly,
    type,
    description,
    season,
    series,
    edition,
    release_year,
    releaseDate,
    themes,
    colours,
    image_urls,
    exclusive,
    link,
    main_animal,
    season_id,
    isComplete,
    inLookbook,
    sort_order,
  } = body

  await c.env.DB.prepare(`
    UPDATE Collections SET
      name = ?, name_friendly = ?, type = ?, description = ?, season = ?,
      series = ?, edition = ?, release_year = ?, releaseDate = ?,
      themes = ?, colours = ?, image_urls = ?, exclusive = ?, link = ?,
      main_animal = ?, season_id = ?, isComplete = ?, inLookbook = ?,
      sort_order = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    name ?? null,
    name_friendly ?? null,
    type ?? null,
    description ?? null,
    season ?? null,
    series ?? null,
    edition ?? null,
    release_year ?? null,
    releaseDate ?? null,
    themes ? JSON.stringify(themes) : null,
    colours ? JSON.stringify(colours) : null,
    image_urls ? JSON.stringify(image_urls) : null,
    exclusive ?? null,
    link ?? null,
    main_animal ?? null,
    season_id ?? null,
    isComplete ?? 0,
    inLookbook ?? 1,
    sort_order ?? null,
    id
  ).run()

  return c.json({ success: true })
})

// ─────────────────────────────────────────────────────────────
// Design Handlers
// ─────────────────────────────────────────────────────────────

export const vendulaDesignsGet = F.createHandlers(async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT
      D.*,
      C.name AS collection_name,
      C.release_year AS collection_year,
      C.season AS collection_season,
      C.series AS collection_series
    FROM Designs D
    LEFT JOIN Collections C ON C.id = D.collection_id
    ORDER BY D.name ASC
  `).all()

  return c.json(results.map(formatDesign))
})

export const vendulaDesignsPost = F.createHandlers(async (c) => {
  const {
    collection_id,
    shape_id,
    name,
    description,
    image_urls,
    price,
    currency,
    shape_name_overwrite,
    shape_measurements_overwrite,
    shape_size_overwrite,
    shape_details_overwrite,
    exclusive_design,
    main_colour,
    product_id,
    sku,
    season,
    product_category,
  } = await c.req.json()

  await c.env.DB.prepare(`
    INSERT INTO Designs (
      collection_id, shape_id, name, description, image_urls, price, currency,
      shape_name_overwrite, shape_measurements_overwrite, shape_size_overwrite,
      shape_details_overwrite, exclusive_design, main_colour, product_id, sku,
      season, product_category
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    collection_id,
    shape_id ?? null,
    name,
    description ?? null,
    JSON.stringify(image_urls ?? []),
    price ?? null,
    currency ?? 'GBP',
    shape_name_overwrite ?? null,
    shape_measurements_overwrite ?? null,
    shape_size_overwrite ?? null,
    shape_details_overwrite ?? null,
    exclusive_design ?? null,
    main_colour ?? null,
    product_id ?? null,
    sku ?? null,
    season ?? null,
    product_category ?? null
  ).run()

  return c.json({ success: true }, 201)
})

export const vendulaDesignsPut = F.createHandlers(async (c) => {
  const id = c.req.param('id')
  const {
    collection_id,
    shape_id,
    name,
    description,
    image_urls,
    price,
    currency,
    shape_name_overwrite,
    shape_measurements_overwrite,
    shape_size_overwrite,
    shape_details_overwrite,
    exclusive_design,
    main_colour,
    product_id,
    sku,
    season,
    product_category,
  } = await c.req.json()

  await c.env.DB.prepare(`
    UPDATE Designs SET
      collection_id = ?, shape_id = ?, name = ?, description = ?, image_urls = ?,
      price = ?, currency = ?, shape_name_overwrite = ?, shape_measurements_overwrite = ?,
      shape_size_overwrite = ?, shape_details_overwrite = ?, exclusive_design = ?,
      main_colour = ?, product_id = ?, sku = ?, season = ?, product_category = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    collection_id ?? null,
    shape_id ?? null,
    name ?? null,
    description ?? null,
    image_urls ? JSON.stringify(image_urls) : null,
    price ?? null,
    currency ?? 'GBP',
    shape_name_overwrite ?? null,
    shape_measurements_overwrite ?? null,
    shape_size_overwrite ?? null,
    shape_details_overwrite ?? null,
    exclusive_design ?? null,
    main_colour ?? null,
    product_id ?? null,
    sku ?? null,
    season ?? null,
    product_category ?? null,
    id
  ).run()

  return c.json({ success: true })
})

// ─────────────────────────────────────────────────────────────
// Shape Handlers
// ─────────────────────────────────────────────────────────────

export const vendulaShapesGet = F.createHandlers(async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM Shapes ORDER BY name ASC').all()
  return c.json(results)
})

export const vendulaShapesPost = F.createHandlers(async (c) => {
  const { name, measurements, category, name_friendly, size, description, intro_season, intro_collection } = await c.req.json()

  await c.env.DB.prepare(`
    INSERT INTO Shapes (name, measurements, category, name_friendly, size, description, intro_season, intro_collection)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    name,
    measurements ?? null,
    category ?? null,
    name_friendly ?? null,
    size ?? null,
    description ?? null,
    intro_season ?? null,
    intro_collection ?? null
  ).run()

  return c.json({ success: true }, 201)
})

export const vendulaShapesPut = F.createHandlers(async (c) => {
  const id = c.req.param('id')
  const { name, measurements, category, name_friendly, size, description, intro_season, intro_collection } = await c.req.json()

  await c.env.DB.prepare(`
    UPDATE Shapes SET
      name = ?, measurements = ?, category = ?, name_friendly = ?, size = ?,
      description = ?, intro_season = ?, intro_collection = ?,
      last_updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    name ?? null,
    measurements ?? null,
    category ?? null,
    name_friendly ?? null,
    size ?? null,
    description ?? null,
    intro_season ?? null,
    intro_collection ?? null,
    id
  ).run()

  return c.json({ success: true })
})