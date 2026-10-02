import fs from "fs/promises";
import path from "path";
import type { MetadataRoute } from "next";

type DiscoveryRecord = {
  targetUrl: string;
  createdAt: string;
};

type DiscoveryDatabase = Record<string, DiscoveryRecord>;

const DISCOVERY_FILE = path.join(
  process.cwd(),
  "data",
  "discovery.json"
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://indexing-prototypes.netlify.app";

  const discoveryDatabase =
    await readDiscovery();

  const discoveryUrls = Object.entries(
    discoveryDatabase
  ).map(([id, record]) => ({
    url: `${baseUrl}/d/${id}`,
    lastModified: new Date(record.createdAt),
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    ...discoveryUrls,
  ];
}