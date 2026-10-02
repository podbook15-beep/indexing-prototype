import fs from "fs/promises";
import path from "path";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

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

const DATA_FILE = path.join(
  process.cwd(),
  "data",
  "discovery.json"
);

const TELEMETRY_FILE = path.join(
  process.cwd(),
  "data",
  "telemetry.json"
);

async function getDiscovery(
  id: string
): Promise<DiscoveryRecord | null> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");

    const database: DiscoveryDatabase = JSON.parse(raw);

    return database[id] || null;
  } catch {
    return null;
  }
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

async function recordTelemetry(
  id: string,
  targetUrl: string,
  userAgent: string,
  referer?: string
) {
  try {
    const dataDir = path.join(
      process.cwd(),
      "data"
    );

    await fs.mkdir(dataDir, {
      recursive: true,
    });

    let events: TelemetryEvent[] = [];

    try {
      const raw = await fs.readFile(
        TELEMETRY_FILE,
        "utf8"
      );

      events = JSON.parse(raw);
    } catch {
      events = [];
    }

    const crawler = detectCrawler(userAgent);

    const event: TelemetryEvent = {
      id: crypto.randomUUID(),
      discoveryId: id,
      targetUrl,
      timestamp: new Date().toISOString(),
      userAgent,
      referer,
      crawler,
      event:
        crawler === "Googlebot"
          ? "googlebot_visit"
          : "discovery_visit",
    };

    events.push(event);

    // Keep only the newest 10,000 events.
    events = events.slice(-10000);

    await fs.writeFile(
      TELEMETRY_FILE,
      JSON.stringify(events, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error(
      "Unable to record telemetry:",
      error
    );
  }
}

export default async function DiscoveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const discovery = await getDiscovery(id);

  if (!discovery) {
    notFound();
  }

  const requestHeaders = await headers();

  const userAgent =
    requestHeaders.get("user-agent") ||
    "Unknown";

  const referer =
    requestHeaders.get("referer") ||
    undefined;

  // Record every server-side visit.
  await recordTelemetry(
    id,
    discovery.targetUrl,
    userAgent,
    referer
  );

  const crawler = detectCrawler(userAgent);

  const isGooglebot =
    crawler === "Googlebot";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#fff",
        display: "flex",
        justifyContent: "center",
        padding: "60px 20px",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "850px",
        }}
      >
        <div
          style={{
            border:
              "1px solid rgba(255,255,255,0.12)",
            borderRadius: "20px",
            padding: "40px",
            background:
              "rgba(255,255,255,0.035)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#888",
              marginBottom: "14px",
            }}
          >
            Resource Discovery
          </div>

          <h1
            style={{
              fontSize: "38px",
              lineHeight: 1.15,
              margin: "0 0 18px",
            }}
          >
            Discovered Resource
          </h1>

          <p
            style={{
              color: "#aaa",
              lineHeight: 1.7,
              marginBottom: "30px",
            }}
          >
            This page provides a public,
            crawlable discovery path to the
            submitted resource.
          </p>

          <div
            style={{
              padding: "18px",
              borderRadius: "12px",
              background:
                "rgba(255,255,255,0.05)",
              marginBottom: "24px",
              wordBreak: "break-all",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#777",
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Target URL
            </div>

            <div
              style={{
                fontSize: "15px",
                color: "#ddd",
              }}
            >
              {discovery.targetUrl}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                padding: "18px",
                borderRadius: "12px",
                background:
                  "rgba(255,255,255,0.04)",
              }}
            >
              <div
                style={{
                  color: "#777",
                  fontSize: "12px",
                  marginBottom: "7px",
                }}
              >
                DISCOVERY ID
              </div>

              <strong>{id}</strong>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "12px",
                background:
                  "rgba(255,255,255,0.04)",
              }}
            >
              <div
                style={{
                  color: "#777",
                  fontSize: "12px",
                  marginBottom: "7px",
                }}
              >
                CREATED
              </div>

              <strong>
                {new Date(
                  discovery.createdAt
                ).toLocaleString()}
              </strong>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "12px",
                background:
                  "rgba(255,255,255,0.04)",
              }}
            >
              <div
                style={{
                  color: "#777",
                  fontSize: "12px",
                  marginBottom: "7px",
                }}
              >
                DETECTED VISITOR
              </div>

              <strong>
                {crawler}
              </strong>
            </div>
          </div>

          {isGooglebot && (
            <div
              style={{
                padding: "18px",
                borderRadius: "12px",
                border:
                  "1px solid rgba(100,220,140,0.35)",
                background:
                  "rgba(100,220,140,0.08)",
                color: "#9df0b5",
                marginBottom: "24px",
              }}
            >
              Googlebot request detected on
              this discovery URL.
            </div>
          )}

          <a
            href={discovery.targetUrl}
            rel="noopener"
            style={{
              display: "inline-block",
              padding: "14px 22px",
              borderRadius: "10px",
              background: "#fff",
              color: "#000",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Visit Target Resource
          </a>
        </div>
      </div>
    </main>
  );
}