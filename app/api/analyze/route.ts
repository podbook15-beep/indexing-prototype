import { NextRequest, NextResponse } from "next/server";

function extractMeta(html: string, name: string) {
  const regex1 = new RegExp(
    `<meta\\s+[^>]*(?:name|property)\\s*=\\s*["']${name}["'][^>]*content\\s*=\\s*["']([^"']*)["'][^>]*>`,
    "i"
  );

  const regex2 = new RegExp(
    `<meta\\s+[^>]*content\\s*=\\s*["']([^"']*)["'][^>]*(?:name|property)\\s*=\\s*["']${name}["'][^>]*>`,
    "i"
  );

  return html.match(regex1)?.[1] ||
    html.match(regex2)?.[1] ||
    null;
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.trim() || null;
}

function extractCanonical(html: string) {
  const regex1 =
    /<link\s+[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i;

  const regex2 =
    /<link\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["']canonical["'][^>]*>/i;

  return html.match(regex1)?.[1] ||
    html.match(regex2)?.[1] ||
    null;
}

async function fetchPage(
  url: string,
  userAgent: string
) {
  const started = Date.now();

  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  const responseTime = Date.now() - started;
  const html = await response.text();

  return {
    status: response.status,
    statusText: response.statusText,
    finalUrl: response.url,
    responseTime,
    html,
    headers: {
      contentType: response.headers.get("content-type"),
      xRobotsTag: response.headers.get("x-robots-tag"),
      server: response.headers.get("server"),
      cacheControl: response.headers.get("cache-control"),
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
    },
  };
}

async function checkRobots(
  targetUrl: string
) {
  try {
    const parsed = new URL(targetUrl);

    const robotsUrl =
      `${parsed.protocol}//${parsed.host}/robots.txt`;

    const response = await fetch(robotsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; IndexingPrototype/1.0)",
      },
      cache: "no-store",
    });

    const text = await response.text();

    return {
      url: robotsUrl,
      status: response.status,
      content: text.slice(0, 20000),
    };
  } catch {
    return {
      url: null,
      status: null,
      content: null,
    };
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const inputUrl = body?.url;

    if (!inputUrl || typeof inputUrl !== "string") {
      return NextResponse.json(
        {
          error: "A URL is required.",
        },
        { status: 400 }
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(inputUrl);
    } catch {
      return NextResponse.json(
        {
          error: "Invalid URL.",
        },
        { status: 400 }
      );
    }

    if (
      !["http:", "https:"].includes(
        parsedUrl.protocol
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only HTTP and HTTPS URLs are supported.",
        },
        { status: 400 }
      );
    }

    const normal = await fetchPage(
      parsedUrl.toString(),
      "Mozilla/5.0 (compatible; IndexingPrototype/1.0)"
    );

    const googlebot = await fetchPage(
      parsedUrl.toString(),
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    );

    const robots = await checkRobots(
      parsedUrl.toString()
    );

    const normalRobots =
      extractMeta(normal.html, "robots") ||
      extractMeta(normal.html, "googlebot");

    const googlebotRobots =
      extractMeta(googlebot.html, "robots") ||
      extractMeta(googlebot.html, "googlebot");

    return NextResponse.json({
      inputUrl,

      normal: {
        status: normal.status,
        statusText: normal.statusText,
        finalUrl: normal.finalUrl,
        responseTime: normal.responseTime,
        contentType: normal.headers.contentType,
        contentLength:
          Buffer.byteLength(
            normal.html,
            "utf8"
          ),
        title: extractTitle(normal.html),
        canonical:
          extractCanonical(normal.html),
        robotsMeta: normalRobots,
        xRobotsTag:
          normal.headers.xRobotsTag,
        server: normal.headers.server,
        cacheControl:
          normal.headers.cacheControl,
        etag: normal.headers.etag,
        lastModified:
          normal.headers.lastModified,
      },

      googlebot: {
        status: googlebot.status,
        statusText: googlebot.statusText,
        finalUrl: googlebot.finalUrl,
        responseTime:
          googlebot.responseTime,
        contentType:
          googlebot.headers.contentType,
        contentLength:
          Buffer.byteLength(
            googlebot.html,
            "utf8"
          ),
        title:
          extractTitle(googlebot.html),
        canonical:
          extractCanonical(
            googlebot.html
          ),
        robotsMeta:
          googlebotRobots,
        xRobotsTag:
          googlebot.headers.xRobotsTag,
      },

      robotsTxt: robots,

comparison: {
  httpStatus:
    normal.status === googlebot.status,

  finalUrl:
    normal.finalUrl === googlebot.finalUrl,

  title:
    extractTitle(normal.html) ===
    extractTitle(googlebot.html),

  contentSize:
    Math.abs(
      Buffer.byteLength(normal.html, "utf8") -
      Buffer.byteLength(googlebot.html, "utf8")
    ) < 1000,
   },
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to analyze URL.",
      },
      { status: 500 }
    );
  }
}