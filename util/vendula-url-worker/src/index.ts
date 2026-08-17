// Run locally:
//   npx wrangler dev --remote
// Test:
//   curl http://localhost:8787/run
// Read latest output:
//   curl http://localhost:8787/latest
// Deploy:
//   npx wrangler login
//   npx wrangler deploy

import puppeteer from "@cloudflare/puppeteer";
import type {
  ExecutionContext,
  ScheduledController,
} from "@cloudflare/workers-types";

interface Env {
  MYBROWSER: Fetcher;
  OUTPUT_BUCKET: R2Bucket;
}

interface ScrapeResult {
  count: number;
  file: string;
}

const START_URL = "https://www.vendulalondon.com/";
const OUTPUT_FILE = "extracted_urls.json";
const MAX_BROWSER_ATTEMPTS = 5;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRateLimitError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("too many")
  );
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise<void>(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

async function launchBrowser(env: Env) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_BROWSER_ATTEMPTS; attempt++) {
    try {
      return await puppeteer.launch(env.MYBROWSER);
    } catch (error) {
      lastError = error;

      if (!isRateLimitError(error) || attempt === MAX_BROWSER_ATTEMPTS) {
        throw error;
      }

      const waitTime = Math.min(
        5000 * 2 ** (attempt - 1),
        60000
      );

      console.warn(
        `Browser rate-limited. Retry ${attempt}/${MAX_BROWSER_ATTEMPTS} in ${waitTime}ms.`
      );

      await delay(waitTime);
    }
  }

  throw lastError;
}

async function extractUrls(env: Env): Promise<ScrapeResult> {
  const browser = await launchBrowser(env);

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: 1440,
      height: 900,
    });

    await page.goto(START_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Allow dynamically loaded links to appear.
    await delay(2000);

    const urls = await page.evaluate((): string[] => {
      const anchors = Array.from(
        document.querySelectorAll<HTMLAnchorElement>("a[href]")
      );

      const normalizedUrls = anchors
        .map(anchor => anchor.href)
        .filter(Boolean)
        .map(href => {
          const url = new URL(href);
          url.hash = "";
          return url.href;
        });

      return [...new Set(normalizedUrls)].sort((a, b) =>
        a.localeCompare(b)
      );
    });

    const validUrls = urls.filter(isHttpUrl);
    const output = JSON.stringify(validUrls, null, 2);

    await env.OUTPUT_BUCKET.put(OUTPUT_FILE, output, {
      httpMetadata: {
        contentType: "application/json; charset=utf-8",
      },
      customMetadata: {
        source: START_URL,
        count: String(validUrls.length),
        updatedAt: new Date().toISOString(),
      },
    });

    console.log(`Saved ${validUrls.length} URLs to ${OUTPUT_FILE}.`);

    return {
      count: validUrls.length,
      file: OUTPUT_FILE,
    };
  } finally {
    await browser.close();
  }
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestUrl = new URL(request.url);

    if (requestUrl.pathname === "/run") {
      try {
        const result = await extractUrls(env);

        return Response.json({
          success: true,
          ...result,
        });
      } catch (error) {
        const message = getErrorMessage(error);

        console.error("Manual scrape failed:", message);

        return Response.json(
          {
            success: false,
            error: message,
          },
          { status: 500 }
        );
      }
    }

    if (requestUrl.pathname === "/latest") {
      const object = await env.OUTPUT_BUCKET.get(OUTPUT_FILE);

      if (!object) {
        return Response.json(
          {
            success: false,
            error: "No output file has been created yet.",
          },
          { status: 404 }
        );
      }

      return new Response(object.body, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    return new Response(
      "Vendula URL Worker is running. Use /run to scrape or /latest to read the saved JSON."
    );
  },

  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(
      extractUrls(env).catch(error => {
        console.error("Scheduled scrape failed:", getErrorMessage(error));
        throw error;
      })
    );
  },
};

export default worker;
