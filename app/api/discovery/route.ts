import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

type DiscoveryRecord = {
  id?: string;
  targetUrl: string;
  createdAt: string;
  updatedAt?: string;
  discoveryUrl?: string;
  status?: string;

  telemetry?: {
    totalVisits: number;
    lastVisitAt: string | null;
    userAgents: string[];
    googlebotHits: number;
    crawlerHits: number;
  };
};

type DiscoveryDatabase = Record<string, DiscoveryRecord>;

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "discovery.json");

async function readDatabase(): Promise<DiscoveryDatabase> {
  try {
    const content = await fs.readFile(dataFile, "utf8");

    if (!content.trim()) {
      return {};
    }

    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function writeDatabase(
  database: DiscoveryDatabase
): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });

  await fs.writeFile(
    dataFile,
    JSON.stringify(database, null, 2),
    "utf8"
  );
}

function createId(targetUrl: string): string {
  return crypto
    .createHash("sha256")
    .update(targetUrl)
    .digest("hex")
    .slice(0, 16);
}

function getBaseUrl(request: NextRequest): string {
  const configured =
    process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const netlifyUrl =
    process.env.URL?.trim();

  if (netlifyUrl) {
    return netlifyUrl.replace(/\/$/, "");
  }

  return request.nextUrl.origin;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const targetUrl =
      typeof body?.url === "string"
        ? body.url.trim()
        : "";

    if (!targetUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "URL is required.",
        },
        { status: 400 }
      );
    }

    if (!isValidHttpUrl(targetUrl)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only valid HTTP or HTTPS URLs are supported.",
        },
        { status: 400 }
      );
    }

    const id = createId(targetUrl);

    const baseUrl = getBaseUrl(request);

    const discoveryUrl =
      `${baseUrl}/d/${id}`;

    const now = new Date().toISOString();

    const database =
      await readDatabase();

    const existing =
      database[id];

    /*
     * Existing discovery record:
     * Always return a freshly generated discovery URL
     * using the current production base URL.
     *
     * This fixes old records that may still contain
     * http://localhost:3000.
     */
    if (existing) {
      const correctedRecord: DiscoveryRecord = {
        ...existing,
        id: existing.id || id,
        targetUrl: existing.targetUrl || targetUrl,
        updatedAt: now,
        discoveryUrl,
      };

      database[id] = correctedRecord;

      try {
        await writeDatabase(database);
      } catch (writeError) {
        console.warn(
          "Could not update existing discovery record:",
          writeError
        );
      }

      return NextResponse.json({
        success: true,
        targetUrl: correctedRecord.targetUrl,
        discoveryUrl,
        id,
        createdAt: correctedRecord.createdAt,
        status: "DISCOVERY_EXISTS",
        message:
          "A discovery record already exists for this URL.",
      });
    }

    /*
     * Create a brand-new discovery record.
     */
    const record: DiscoveryRecord = {
      id,
      targetUrl,
      createdAt: now,
      updatedAt: now,
      discoveryUrl,
      status: "DISCOVERY_CREATED",

      telemetry: {
        totalVisits: 0,
        lastVisitAt: null,
        userAgents: [],
        googlebotHits: 0,
        crawlerHits: 0,
      },
    };

    database[id] = record;

    await writeDatabase(database);

    return NextResponse.json({
      success: true,
      targetUrl,
      discoveryUrl,
      id,
      createdAt: now,
      status: "DISCOVERY_CREATED",
      message:
        "Public discovery resource created successfully.",
    });
  } catch (error) {
    console.error(
      "Discovery API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create discovery resource.",
      },
      { status: 500 }
    );
  }
}