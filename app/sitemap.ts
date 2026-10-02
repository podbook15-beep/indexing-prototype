import type { MetadataRoute } from "next";
import { promises as fs } from "fs";
import path from "path";

type DiscoveryRecord = {
  id: string;
  createdAt: string;
};

type DiscoveryDatabase =
  Record<string, DiscoveryRecord>;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
  ];

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

    const database:
      DiscoveryDatabase =
      JSON.parse(content);

    for (const record of Object.values(
      database
    )) {
      entries.push({
        url:
          `${baseUrl}/d/${record.id}`,
        lastModified:
          new Date(record.createdAt),
      });
    }
  } catch {
    // Keep the homepage in the sitemap
    // if discovery data is unavailable.
  }

  return entries;
}