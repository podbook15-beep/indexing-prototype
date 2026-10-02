import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type DiscoveryRecord = {
  targetUrl: string;
  createdAt: string;
};

type DiscoveryDatabase = Record<string, DiscoveryRecord>;

type TelemetryEvent = {
  id: string;
  discoveryId: string;
  targetUrl: string;
  timestamp: string;
  userAgent: string;
  referer?: string;
  crawler: string;
  event: string;
};

const DISCOVERY_FILE = path.join(
  process.cwd(),
  "data",
  "discovery.json"
);

const TELEMETRY_FILE = path.join(
  process.cwd(),
  "data",
  "telemetry.json"
);

async function readDiscovery(): Promise<DiscoveryDatabase> {
  try {
    const raw = await fs.readFile(
      DISCOVERY_FILE,
      "utf8"
    );

    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function readTelemetry(): Promise<TelemetryEvent[]> {
  try {
    const raw = await fs.readFile(
      TELEMETRY_FILE,
      "utf8"
    );

    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing discovery ID.",
        },
        { status: 400 }
      );
    }

    const discoveryDatabase = await readDiscovery();

    const discovery = discoveryDatabase[id];

    if (!discovery) {
      return NextResponse.json(
        {
          success: false,
          error: "Discovery record not found.",
        },
        { status: 404 }
      );
    }

    const allTelemetry = await readTelemetry();

    const events = allTelemetry
      .filter(
        (event) =>
          event.discoveryId === id
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      );

    const googlebotEvents = events.filter(
      (event) =>
        event.crawler === "Googlebot"
    );

    const browserEvents = events.filter(
      (event) =>
        event.crawler === "Browser"
    );

    const otherCrawlerEvents = events.filter(
      (event) =>
        event.crawler !== "Googlebot" &&
        event.crawler !== "Browser"
    );

    const latestEvent = events[0] || null;

    const googlebotDetected =
      googlebotEvents.length > 0;

    const discoveryVisited =
      events.length > 0;

    const status = {
      submitted: true,

      targetAccessible: true,

      discoveryCreated: true,

      discoveryVisited,

      googlebotDetected,

      googleSearchObserved: null,

      targetUrl: discovery.targetUrl,

      discoveryId: id,

      createdAt: discovery.createdAt,

      crawlerStats: {
        total: events.length,
        browser: browserEvents.length,
        googlebot: googlebotEvents.length,
        other: otherCrawlerEvents.length,
      },

      latestEvent,

      latestGooglebotEvent:
        googlebotEvents[0] || null,

      events: events.slice(0, 50),
    };

    return NextResponse.json(
      {
        success: true,
        status,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Status API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve status.",
      },
      { status: 500 }
    );
  }
}