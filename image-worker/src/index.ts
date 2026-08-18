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

    // 3) Serve images from R2 for all other GET requests
    if (req.method === "GET" || req.method === "HEAD") {
      // Remove leading slash for R2 key
      const key = path.startsWith("/") ? path.slice(1) : path;

      try {
        const object = await env.R2.get(key);

        if (object === null) {
          return new Response("Object not found", { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);

        // Set CORS headers
        headers.set("Access-Control-Allow-Origin", "https://vendulette.com");
        headers.set("Access-Control-Allow-Origin", "http://localhost:5174");
          headers.set("Access-Control-Allow-Origin", "http://localhost:5173");

        // Set cache headers for better performance
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        return new Response(object.body, {
          headers,
          status: 200,
        });
      } catch (error) {
        return new Response("Error fetching object", { status: 500 });
      }
    }

    // Fallback for other methods
    return new Response("Not found", { status: 404 });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Run bulk migration on schedule
    await runBulkMigration(env);
  }
};