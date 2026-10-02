import { promises as fs } from "fs";
import path from "path";

type DiscoveryRecord = {
  id: string;
  targetUrl: string;
  createdAt: string;
};

type DiscoveryDatabase =
  Record<string, DiscoveryRecord>;

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  let database:
    DiscoveryDatabase = {};

  try {
    const file =
      path.join(
        process.cwd(),
        "data",
        "discovery.json"
      );

    const content =
      await fs.readFile(
        file,
        "utf8"
      );

    database =
      JSON.parse(content);
  } catch {
    database = {};
  }

  const records =
    Object.values(database)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

  const items = records
    .map((record) => {
      const discoveryUrl =
        `${baseUrl}/d/${record.id}`;

      return `
        <item>
          <title><![CDATA[Discovered Resource]]></title>
          <link>${escapeXml(discoveryUrl)}</link>
          <guid isPermaLink="true">${escapeXml(discoveryUrl)}</guid>
          <description><![CDATA[
            Public discovery resource for ${record.targetUrl}
          ]]></description>
          <pubDate>${new Date(
            record.createdAt
          ).toUTCString()}</pubDate>
        </item>
      `;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Resource Discovery Feed</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Public discovery resources</description>
    ${items}
  </channel>
</rss>`;

  return new Response(
    xml,
    {
      headers: {
        "Content-Type":
          "application/rss+xml; charset=utf-8",

        "Cache-Control":
          "no-store",
      },
    }
  );
}

function escapeXml(
  value: string
): string {
  return value
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&apos;"
    );
}