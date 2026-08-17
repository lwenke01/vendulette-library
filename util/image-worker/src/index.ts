export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  PUBLIC_IMAGE_BASE_URL: string;
}

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

function getExt(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("svg")) return "svg";
  if (contentType.includes("jpeg")) return "jpg";
  return "jpg";
}

const MAX_IMAGES_PER_DESIGN = 5;
const BULK_DESIGN_LIMIT = 20;

async function migrateDesign(
  env: Env,
  designId: number,
  imageLimit?: number
): Promise<{ designId: number; migrated: number; error?: string }> {
  const design = await env.DB
    .prepare(`
      SELECT
        d.id,
        d.collection_id,
        d.season,
        d.name,
        d.image_urls
      FROM Designs d
      WHERE d.id = ?
    `)
    .bind(designId)
    .first<{
      id: number;
      collection_id: number;
      season: string | null;
      name: string | null;
      image_urls: string | null;
    }>();

  if (!design) {
    return { designId: designId, migrated: 0, error: "Design not found" };
  }

  if (!design.image_urls) {
    return { designId: designId, migrated: 0, error: "No image_urls for this design" };
  }

  let urls: string[];
  try {
    urls = JSON.parse(design.image_urls);
    if (!Array.isArray(urls)) throw new Error();
  } catch {
    return { designId: designId, migrated: 0, error: "image_urls must be a JSON array of strings" };
  }

  const limit = imageLimit ?? urls.length;
  const urlsToMigrate = urls.slice(0, limit);

  // Clear existing images for this design
  await env.DB
    .prepare(`DELETE FROM DesignImages WHERE design_id = ?`)
    .bind(designId)
    .run();

  const inserts: D1PreparedStatement[] = [];

  for (let i = 0; i < urlsToMigrate.length; i++) {
    const sourceUrl = urlsToMigrate[i];

    const remoteRes = await fetch(sourceUrl);
    if (!remoteRes.ok) {
      throw new Error(`Failed to fetch ${sourceUrl}: ${remoteRes.status}`);
    }

    const contentType = remoteRes.headers.get("content-type") || "application/octet-stream";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Not an image: ${sourceUrl}`);
    }

    const ext = getExt(contentType);
    const key = `collections/${design.collection_id}/designs/${designId}/${i}.${ext}`;
    const buffer = await remoteRes.arrayBuffer();

    await env.R2.put(key, buffer, { httpMetadata: { contentType } });

    const publicUrl = `${env.PUBLIC_IMAGE_BASE_URL}/${key}`;

    inserts.push(
      env.DB
        .prepare(`
          INSERT INTO DesignImages (
            season,
            collection_id,
            design_id,
            storage_key,
            public_url,
            alt_text,
            sort_order,
            is_primary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          design.season,
          design.collection_id,
          designId,
          key,
          publicUrl,
          design.name ?? null, // alt_text
          i,
          i === 0 ? 1 : 0
        )
    );
  }

  if (inserts.length) {
    await env.DB.batch(inserts);
  }

  // Update last_migrated_at
  const now = new Date().toISOString();
  await env.DB
    .prepare(`UPDATE Designs SET last_migrated_at = ? WHERE id = ?`)
    .bind(now, designId)
    .run();

  return { designId, migrated: inserts.length };
}

async function runBulkMigration(env: Env) {
  const designs = await env.DB
    .prepare(`
      SELECT
        d.id,
        d.collection_id,
        d.season,
        d.name,
        d.image_urls,
        d.last_migrated_at
      FROM Designs d
      WHERE (
        d.image_urls IS NOT NULL
        OR EXISTS (
          SELECT 1 FROM DesignImages di WHERE di.design_id = d.id
        )
      )
      AND (
        d.last_migrated_at IS NULL
        OR d.updated_at > d.last_migrated_at
      )
      LIMIT ?
    `)
    .bind(BULK_DESIGN_LIMIT)
    .all<{
      id: number;
      collection_id: number;
      season: string | null;
      name: string | null;
      image_urls: string | null;
      last_migrated_at: string | null;
    }>();

  const results: Array<{ designId: number; migrated: number; error?: string }> = [];

  for (const design of designs.results) {
    try {
      if (!design.image_urls) {
        results.push({ designId: design.id, migrated: 0 });
        continue;
      }

      let urls: string[];
      try {
        urls = JSON.parse(design.image_urls);
        if (!Array.isArray(urls)) throw new Error();
      } catch {
        results.push({
          designId: design.id,
          migrated: 0,
          error: "Invalid image_urls JSON"
        });
        continue;
      }

      await env.DB
        .prepare(`DELETE FROM DesignImages WHERE design_id = ?`)
        .bind(design.id)
        .run();

      const urlsToMigrate = urls.slice(0, MAX_IMAGES_PER_DESIGN);
      const inserts: D1PreparedStatement[] = [];

      for (let i = 0; i < urlsToMigrate.length; i++) {
        const sourceUrl = urlsToMigrate[i];

        const remoteRes = await fetch(sourceUrl);
        if (!remoteRes.ok) {
          throw new Error(`Failed to fetch ${sourceUrl}: ${remoteRes.status}`);
        }

        const contentType = remoteRes.headers.get("content-type") || "application/octet-stream";
        if (!contentType.startsWith("image/")) {
          throw new Error(`Not an image: ${sourceUrl}`);
        }

        const ext = getExt(contentType);
        const key = `collections/${design.collection_id}/designs/${design.id}/${i}.${ext}`;
        const buffer = await remoteRes.arrayBuffer();

        await env.R2.put(key, buffer, { httpMetadata: { contentType } });

        const publicUrl = `${env.PUBLIC_IMAGE_BASE_URL}/${key}`;

        inserts.push(
          env.DB
            .prepare(`
              INSERT INTO DesignImages (
                season,
                collection_id,
                design_id,
                storage_key,
                public_url,
                alt_text,
                sort_order,
                is_primary
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
              design.season,
              design.collection_id,
              design.id,
              key,
              publicUrl,
              design.name ?? null,
              i,
              i === 0 ? 1 : 0
            )
        );
      }

      if (inserts.length) {
        await env.DB.batch(inserts);
      }

      const now = new Date().toISOString();
      await env.DB
        .prepare(`UPDATE Designs SET last_migrated_at = ? WHERE id = ?`)
        .bind(now, design.id)
        .run();

      results.push({ designId: design.id, migrated: inserts.length });
    } catch (err) {
      results.push({
        designId: design.id,
        migrated: 0,
        error: err instanceof Error ? err.message : "Unknown error"
      });
    }
  }

  return {
    success: true,
    processed: results.length,
    results
  };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    // 1) Bulk migration: POST /migrate-design-images/bulk
    if (req.method === "POST" && path === "/migrate-design-images/bulk") {
      const result = await runBulkMigration(env);
      return json(result);
    }

    // 2) Single-design migration: POST /migrate-design-images/:id
    if (req.method === "POST" && path.startsWith("/migrate-design-images/")) {
      const parts = path.split("/").filter(Boolean);
      const last = parts[parts.length - 1];

      if (!/^\d+$/.test(last)) {
        return json({ error: "Invalid design id" }, { status: 400 });
      }

      const designId = Number(last);

      try {
        const result = await migrateDesign(env, designId, MAX_IMAGES_PER_DESIGN);
        if (result.error) {
          return json(result, { status: 400 });
        }
        return json(result);
      } catch (err) {
        return json(
          {
            error: err instanceof Error ? err.message : "Unknown error",
            designId
          },
          { status: 400 }
        );
      }
    }

    // Fallback
    return new Response("Not found", { status: 404 });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Run bulk migration on schedule
    await runBulkMigration(env);
  }
};