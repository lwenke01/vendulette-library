import { createFactory } from 'hono/factory'

const F = createFactory()

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
    themes: safeJson(row.themes),
    colours: safeJson(row.colours),
    image_urls: safeJson(row.image_urls),
  }
}

/**
 * Format a design row, using shape overrides when available, otherwise falling back to shape data.
 */
function formatDesign(row: any) {
  // Determine final shape_name: prefer override if shape is unknown/missing
  let finalShapeName: string | null = null
  const shapeName = row.shape_name
  const shapeNameOverwrite = row.shape_name_overwrite

  if (shapeNameOverwrite) {
    // Convert to ProperCase: "my bag" → "My Bag"
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
    shape_desc: row.shape_desc ?? row.shape_details_overwrite ??  row.description ?? null,
    image_urls: safeJson(row.image_urls),
  }
}

function parseLimit(raw: string | null) {
  let limit = parseInt(raw || '500', 10)
  if (!Number.isFinite(limit) || limit <= 0) limit = 500
  if (limit > 1000) limit = 1000
  return limit
}

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
              'product_category', d.product_category,
              'shape_name', s.name,
              'measurements', s.measurements,
              'shape_category', s.category,
              'shape_size', s.size,
              'shape_desc', s.description
            )
          )
          FROM Designs AS d
          LEFT JOIN Shapes AS s ON s.id = d.shape_id
          WHERE d.collection_id = c.id
        ),
        '[]'
      ) AS designs
    FROM Collections AS c
    ${whereClause}
  
    ORDER BY c.sort_order DESC
    LIMIT ${limit}
  `

  const { results } = await c.env.DB.prepare(sql).all(...params)

  const cleaned = results.map((row: any) => {
    const designs = safeJson(row.designs)
    return {
      ...formatCollection(row),
      designs: designs.map((design: any) => ({
        ...formatDesign(design),
      })),
    }
  })

  return c.json(cleaned)
})

export const vendulaCollectionById = F.createHandlers(async (c) => {
  const id = c.req.param('id')

  const collection = await c.env.DB.prepare(
    'SELECT * FROM Collections WHERE id = ?'
  )
    .bind(id)
    .first()

  if (!collection) return c.json({ error: 'Not found' }, 404)

  const { results: designs } = await c.env.DB.prepare(`
    SELECT D.*,
           S.name as shape_name,
           S.measurements,
           S.category as shape_category,
           S.size as shape_size,
           S.description as shape_desc
    FROM Designs D
    LEFT JOIN Shapes S ON D.shape_id = S.id
    WHERE D.collection_id = ?
    ORDER BY D.name ASC
  `)
    .bind(id)
    .all()

  return c.json({
    ...formatCollection(collection),
    designs: designs.map(formatDesign),
  })
})

export const vendulaDesignsGet = F.createHandlers(async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT
      D.*,
      C.name AS collection_name,
      C.release_year AS collection_year,
      C.season AS collection_season,
      C.series AS collection_series,
      S.name AS shape_name,
      S.measurements,
      S.category AS shape_category,
      S.size AS shape_size,
      S.description AS shape_desc
    FROM Designs D
    LEFT JOIN Collections C ON C.id = D.collection_id
    LEFT JOIN Shapes S ON S.id = D.shape_id
    ORDER BY
      COALESCE(C.sort_order, 0) DESC,
      D.name ASC
  `).all()

  return c.json(
    results.map((row: any) => ({
      ...formatDesign(row),
    }))
  )
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

  await c.env.DB.prepare(
    `INSERT INTO Designs (
      collection_id, shape_id, name, description, image_urls, price, currency,
      shape_name_overwrite, shape_measurements_overwrite, shape_size_overwrite,
      shape_details_overwrite, exclusive_design, main_colour, product_id, sku,
      season, product_category
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      collection_id,
      shape_id,
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
    )
    .run()

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

  await c.env.DB.prepare(
    `UPDATE Designs SET
      collection_id=?, shape_id=?, name=?, description=?, image_urls=?, price=?, currency=?,
      shape_name_overwrite=?, shape_measurements_overwrite=?, shape_size_overwrite=?,
      shape_details_overwrite=?, exclusive_design=?, main_colour=?, product_id=?, sku=?,
      season=?, product_category=?
     WHERE id=?`
  )
    .bind(
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
    )
    .run()

  return c.json({ success: true })
})

export const vendulaShapesGet = F.createHandlers(async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM Shapes ORDER BY name ASC').all()
  return c.json(results)
})

export const vendulaShapesPost = F.createHandlers(async (c) => {
  const { name, measurements, category, name_friendly, size, description, intro_season, intro_collection } = await c.req.json()

  await c.env.DB.prepare(
    `INSERT INTO Shapes (name, measurements, category, name_friendly, size, description, intro_season, intro_collection)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      name,
      measurements ?? null,
      category ?? null,
      name_friendly ?? null,
      size ?? null,
      description ?? null,
      intro_season ?? null,
      intro_collection ?? null
    )
    .run()

  return c.json({ success: true }, 201)
})

export const vendulaShapesPut = F.createHandlers(async (c) => {
  const id = c.req.param('id')
  const { name, measurements, category, name_friendly, size, description, intro_season, intro_collection } = await c.req.json()

  await c.env.DB.prepare(
    `UPDATE Shapes SET
      name=?, measurements=?, category=?, name_friendly=?, size=?, description=?, intro_season=?, intro_collection=?
     WHERE id=?`
  )
    .bind(
      name ?? null,
      measurements ?? null,
      category ?? null,
      name_friendly ?? null,
      size ?? null,
      description ?? null,
      intro_season ?? null,
      intro_collection ?? null,
      id
    )
    .run()

  return c.json({ success: true })
})

export const vendulaCollectionsPost = F.createHandlers(async (c) => {
  const body = await c.req.json()
  const {
    name,
    description,
    season,
    series,
    edition,
    release_year,
    themes,
    colours,
    name_friendly,
    type,
    image_urls,
    releaseDate,
    exclusive,
    isComplete,
    link,
    inLookbook,
  } = body

  await c.env.DB.prepare(`
    INSERT INTO Collections (
      name, description, season, series, edition, release_year,
      themes, colours, name_friendly, type, image_urls, releaseDate,
      exclusive, isComplete, link, inLookbook
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      name,
      description ?? null,
      season ?? null,
      series ?? null,
      edition ?? null,
      release_year ?? null,
      JSON.stringify(themes ?? []),
      JSON.stringify(colours ?? []),
      name_friendly ?? null,
      type ?? null,
      JSON.stringify(image_urls ?? []),
      releaseDate ?? null,
      exclusive ?? null,
      isComplete ?? 0,
      link ?? null,
      inLookbook ?? 1
    )
    .run()

  return c.json({ success: true }, 201)
})

export const vendulaCollectionsPut = F.createHandlers(async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const {
    name,
    description,
    season,
    series,
    edition,
    release_year,
    themes,
    colours,
    name_friendly,
    type,
    image_urls,
    releaseDate,
    exclusive,
    isComplete,
    link,
    inLookbook,
  } = body

  await c.env.DB.prepare(`
    UPDATE Collections SET
      name=?, description=?, season=?, series=?, edition=?, release_year=?,
      themes=?, colours=?, name_friendly=?, type=?, image_urls=?, releaseDate=?,
      exclusive=?, isComplete=?, link=?, inLookbook=?
    WHERE id=?
  `)
    .bind(
      name ?? null,
      description ?? null,
      season ?? null,
      series ?? null,
      edition ?? null,
      release_year ?? null,
      themes ? JSON.stringify(themes) : null,
      colours ? JSON.stringify(colours) : null,
      name_friendly ?? null,
      type ?? null,
      image_urls ? JSON.stringify(image_urls) : null,
      releaseDate ?? null,
      exclusive ?? null,
      isComplete ?? 0,
      link ?? null,
      inLookbook ?? 1,
      id
    )
    .run()

  return c.json({ success: true })
})