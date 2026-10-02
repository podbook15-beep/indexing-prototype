import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type TelemetryEvent = {
  id: string;
  discoveryId: string;
  targetUrl: string;
  timestamp: string;
  userAgent: string;
  ip?: string;
  referer?: string;
  crawler: string;
  event: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const TELEMETRY_FILE = path.join(DATA_DIR, "telemetry.json");

async function ensureTelemetryFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(TELEMETRY_FILE);
  } catch {
    await fs.writeFile(
      TELEMETRY_FILE,
      JSON.stringify([], null, 2),
      "utf8"
    );
  }
}

async function readTelemetry(): Promise<TelemetryEvent[]> {
  await ensureTelemetryFile();

  try {
    const raw = await fs.readFile(TELEMETRY_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeTelemetry(events: TelemetryEvent[]) {
  await ensureTelemetryFile();

  await fs.writeFile(
    TELEMETRY_FILE,
    JSON.stringify(events, null, 2),
    "utf8"
  );
}

function detectCrawler(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes("googlebot")) {
    return "Googlebot";
  }

  if (ua.includes("bingbot")) {
    return "Bingbot";
  }

  if (ua.includes("duckduckbot")) {
    return "DuckDuckBot";
  }

  if (ua.includes("yandexbot")) {
    return "YandexBot";
  }

  if (ua.includes("baiduspider")) {
    return "Baiduspider";
  }

  if (ua.includes("facebookexternalhit")) {
    return "Facebook";
  }

  if (ua.includes("twitterbot")) {
    return "Twitter";
  }

  if (ua.includes("linkedinbot")) {
    return "LinkedIn";
  }

  if (ua.includes("semrushbot")) {
    return "SemrushBot";
  }

  if (ua.includes("ahrefsbot")) {
    return "AhrefsBot";
  }

  if (
    ua.includes("bot") ||
    ua.includes("crawler") ||
    ua.includes("spider") ||
    ua.includes("slurp")
  ) {
    return "Other Crawler";
  }

  return "Browser";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const discoveryId = String(body.discoveryId || "").trim();
    const targetUrl = String(body.targetUrl || "").trim();
    const event = String(body.event || "telemetry").trim();

    if (!discoveryId || !targetUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "discoveryId and targetUrl are required",
        },
        { status: 400 }
      );
    }

    const userAgent =
      request.headers.get("user-agent") || "Unknown";

    const referer =
      request.headers.get("referer") || undefined;

    const forwardedFor =
      request.headers.get("x-forwarded-for");

    const ip =
      forwardedFor?.split(",")[0]?.trim() || undefined;

    const crawler = detectCrawler(userAgent);

    const telemetryEvent: TelemetryEvent = {
      id: crypto.randomUUID(),
      discoveryId,
      targetUrl,
      timestamp: new Date().toISOString(),
      userAgent,
      ip,
      referer,
      crawler,
      event,
    };

    const events = await readTelemetry();

    events.push(telemetryEvent);

    // Keep the prototype database from growing forever.
    // Retain the newest 10,000 events.
    const trimmed = events.slice(-10000);

    await writeTelemetry(trimmed);

    return NextResponse.json({
      ok: true,
      crawler,
      event: telemetryEvent,
    });
  } catch (error) {
    console.error("Telemetry error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Telemetry failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const discoveryId =
      request.nextUrl.searchParams.get("discoveryId");

    const crawler =
      request.nextUrl.searchParams.get("crawler");

    let events = await readTelemetry();

    if (discoveryId) {
      events = events.filter(
        (event) => event.discoveryId === discoveryId
      );
    }

    if (crawler) {
      events = events.filter(
        (event) =>
          event.crawler.toLowerCase() ===
          crawler.toLowerCase()
      );
    }

    return NextResponse.json({
      ok: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Telemetry GET error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Unable to read telemetry",
      },
      { status: 500 }
    );
  }
}