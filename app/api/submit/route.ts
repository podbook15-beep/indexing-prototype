import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

type SubmissionRecord = {
  id: string;
  targetUrl: string;
  createdAt: string;
  updatedAt: string;

  discoveryUrl: string;

  status: {
    submitted: boolean;
    discoveryCreated: boolean;
    discoveryLive: boolean;
    sitemapReady: boolean;
    targetAccessible: boolean;
    crawlerDetected: boolean;
    googlebotDetected: boolean;
    googleSearchObserved: boolean;
  };

  telemetry: {
    totalVisits: number;
    crawlerVisits: number;
    googlebotVisits: number;
    lastVisitAt: string | null;
    lastUserAgent: string | null;
  };
};

type SubmissionDatabase =
  Record<string, SubmissionRecord>;

const dataDir = path.join(
  process.cwd(),
  "data"
);

const dataFile = path.join(
  dataDir,
  "submissions.json"
);

async function readDatabase(): Promise<SubmissionDatabase> {
  try {
    const content =
      await fs.readFile(
        dataFile,
        "utf8"
      );

    if (!content.trim()) {
      return {};
    }

    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function writeDatabase(
  database: SubmissionDatabase
): Promise<void> {
  await fs.mkdir(
    dataDir,
    { recursive: true }
  );

  await fs.writeFile(
    dataFile,
    JSON.stringify(
      database,
      null,
      2
    ),
    "utf8"
  );
}

function createId(
  targetUrl: string
): string {
  return crypto
    .createHash("sha256")
    .update(targetUrl)
    .digest("hex")
    .slice(0, 16);
}

function getBaseUrl(
  request: NextRequest
): string {
  const configured =
    process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (configured) {
    return configured.replace(
      /\/$/,
      ""
    );
  }

  return request.nextUrl.origin;
}

function isValidHttpUrl(
  value: string
): boolean {
  try {
    const parsed =
      new URL(value);

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

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

    if (
      !isValidHttpUrl(
        targetUrl
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only valid HTTP or HTTPS URLs are supported.",
        },
        { status: 400 }
      );
    }

    const id =
      createId(targetUrl);

    const baseUrl =
      getBaseUrl(request);

    const discoveryUrl =
      `${baseUrl}/d/${id}`;

    const database =
      await readDatabase();

    const existing =
      database[id];

    if (existing) {
      return NextResponse.json({
        success: true,
        existing: true,
        submission: existing,
      });
    }

    const now =
      new Date().toISOString();

    const submission:
      SubmissionRecord = {
      id,
      targetUrl,
      createdAt: now,
      updatedAt: now,

      discoveryUrl,

      status: {
        submitted: true,
        discoveryCreated: true,
        discoveryLive: true,
        sitemapReady: true,
        targetAccessible: false,
        crawlerDetected: false,
        googlebotDetected: false,
        googleSearchObserved: false,
      },

      telemetry: {
        totalVisits: 0,
        crawlerVisits: 0,
        googlebotVisits: 0,
        lastVisitAt: null,
        lastUserAgent: null,
      },
    };

    database[id] =
      submission;

    await writeDatabase(
      database
    );

    return NextResponse.json({
      success: true,
      existing: false,
      submission,
    });
  } catch (error) {
    console.error(
      "Submit API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to submit URL.",
      },
      { status: 500 }
    );
  }
}