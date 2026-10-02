"use client";

import { useState } from "react";
import {
  Search,
  Bot,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Radio,
  Globe,
  Loader2,
} from "lucide-react";

import DiscoveryStatus from "@/components/DiscoveryStatus";

type AnalysisResult = {
  success?: boolean;

  url?: string;

  normal?: {
    status?: number;
    statusText?: string;
    responseTime?: number;
    finalUrl?: string;
    contentType?: string;
    contentLength?: number;
    title?: string;
    canonical?: string | null;
    metaRobots?: string | null;
    xRobotsTag?: string | null;
    server?: string | null;
    cacheControl?: string | null;
  };

  googlebot?: {
    status?: number;
    statusText?: string;
    responseTime?: number;
    finalUrl?: string;
    contentType?: string;
    contentLength?: number;
    title?: string;
    canonical?: string | null;
    metaRobots?: string | null;
    xRobotsTag?: string | null;
    server?: string | null;
    cacheControl?: string | null;
  };

  comparison?: {
    httpStatus?: boolean;
    finalUrl?: boolean;
    title?: boolean;
    contentSize?: boolean;
  };

  indexability?: {
    canonical?: string | null;
    metaRobots?: string | null;
    xRobotsTag?: string | null;
  };

  error?: string;
};

type DiscoveryResult = {
  success?: boolean;
  targetUrl?: string;
  discoveryUrl?: string;
  id?: string;
  createdAt?: string;
  status?: string;
  message?: string;
  error?: string;
};

export default function Home() {
  const [url, setUrl] = useState("");

  const [loading, setLoading] = useState(false);

  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [error, setError] = useState("");

  const [discoveryLoading, setDiscoveryLoading] =
    useState(false);

  const [discovery, setDiscovery] =
    useState<DiscoveryResult | null>(null);

  const [copyMessage, setCopyMessage] =
    useState("");

  async function analyzeUrl() {
    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setDiscovery(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to analyze URL."
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function createDiscovery() {
    if (!url.trim()) {
      setError("Please enter a URL first.");
      return;
    }

    setDiscoveryLoading(true);
    setError("");
    setDiscovery(null);

    try {
      const response = await fetch("/api/discovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
        }),
      });

      const data: DiscoveryResult =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to create discovery signal."
        );
      }

      setDiscovery(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create discovery signal."
      );
    } finally {
      setDiscoveryLoading(false);
    }
  }

  async function copyDiscoveryUrl() {
    if (!discovery?.discoveryUrl) return;

    await navigator.clipboard.writeText(
      discovery.discoveryUrl
    );

    setCopyMessage("Copied!");

    setTimeout(() => {
      setCopyMessage("");
    }, 2000);
  }

  function openGoogleCheck() {
    if (!url.trim()) return;

    const query = encodeURIComponent(
      `"${url.trim()}"`
    );

    window.open(
      `https://www.google.com/search?q=${query}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function formatBytes(bytes?: number) {
    if (!bytes) return "—";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-10">
          <div className="mb-3 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Radio className="h-5 w-5 text-blue-400" />
            </div>

            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
              Indexing Prototype
            </span>

          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            URL Discovery & Crawl Analyzer
          </h1>

          <p className="mt-3 max-w-3xl text-gray-400">
            Analyze how a public URL responds to normal
            crawlers and Googlebot, then create a crawlable
            discovery page for controlled testing.
          </p>
        </div>


        {/* =====================================================
            URL INPUT
        ===================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">

          <div className="mb-4 flex items-center gap-2">

            <Globe className="h-5 w-5 text-blue-400" />

            <h2 className="text-lg font-semibold">
              Target URL
            </h2>

          </div>

          <div className="flex flex-col gap-3 md:flex-row">

            <input
              type="url"
              value={url}
              onChange={(e) =>
                setUrl(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  analyzeUrl();
                }
              }}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-blue-500/60"
            />

            <button
              onClick={analyzeUrl}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  ANALYZING...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  ANALYZE URL
                </>
              )}

            </button>

          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

        </section>


        {/* =====================================================
            RESULTS
        ===================================================== */}

        {result && (
          <div className="mt-8 space-y-6">


            {/* =================================================
                NORMAL CRAWLER + GOOGLEBOT
            ================================================= */}

            <div className="grid gap-6 lg:grid-cols-2">


              {/* NORMAL CRAWLER */}

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

                <div className="mb-6 flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="rounded-lg bg-purple-500/10 p-2">
                      <Globe className="h-5 w-5 text-purple-400" />
                    </div>

                    <div>

                      <h2 className="font-semibold">
                        Normal Crawler
                      </h2>

                      <p className="text-xs text-gray-500">
                        Standard browser/crawler request
                      </p>

                    </div>

                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    {result.normal?.status || "—"}
                  </span>

                </div>

                <div className="space-y-3 text-sm">

                  <InfoRow
                    label="HTTP Status"
                    value={`${result.normal?.status || "—"} ${result.normal?.statusText || ""}`}
                  />

                  <InfoRow
                    label="Response Time"
                    value={`${result.normal?.responseTime || "—"} ms`}
                  />

                  <InfoRow
                    label="Final URL"
                    value={
                      result.normal?.finalUrl || "—"
                    }
                  />

                  <InfoRow
                    label="Content Type"
                    value={
                      result.normal?.contentType || "—"
                    }
                  />

                  <InfoRow
                    label="Content Size"
                    value={formatBytes(
                      result.normal?.contentLength
                    )}
                  />

                  <InfoRow
                    label="Title"
                    value={
                      result.normal?.title || "—"
                    }
                  />

                </div>

              </section>


              {/* GOOGLEBOT */}

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

                <div className="mb-6 flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <Bot className="h-5 w-5 text-blue-400" />
                    </div>

                    <div>

                      <h2 className="font-semibold">
                        Googlebot
                      </h2>

                      <p className="text-xs text-gray-500">
                        Googlebot user-agent request
                      </p>

                    </div>

                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    {result.googlebot?.status || "—"}
                  </span>

                </div>

                <div className="space-y-3 text-sm">

                  <InfoRow
                    label="HTTP Status"
                    value={`${result.googlebot?.status || "—"} ${result.googlebot?.statusText || ""}`}
                  />

                  <InfoRow
                    label="Response Time"
                    value={`${result.googlebot?.responseTime || "—"} ms`}
                  />

                  <InfoRow
                    label="Final URL"
                    value={
                      result.googlebot?.finalUrl || "—"
                    }
                  />

                  <InfoRow
                    label="Content Type"
                    value={
                      result.googlebot?.contentType || "—"
                    }
                  />

                  <InfoRow
                    label="Content Size"
                    value={formatBytes(
                      result.googlebot?.contentLength
                    )}
                  />

                  <InfoRow
                    label="Title"
                    value={
                      result.googlebot?.title || "—"
                    }
                  />

                </div>

              </section>

            </div>


            {/* =================================================
                GOOGLEBOT COMPARISON
            ================================================= */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <div className="mb-5 flex items-center gap-3">

                <Search className="h-5 w-5 text-cyan-400" />

                <h2 className="text-lg font-semibold">
                  Googlebot Comparison
                </h2>

              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                <ComparisonCard
                  label="HTTP Status"
                  value={
                    result.comparison?.httpStatus
                  }
                />

                <ComparisonCard
                  label="Final URL"
                  value={
                    result.comparison?.finalUrl
                  }
                />

                <ComparisonCard
                  label="Page Title"
                  value={
                    result.comparison?.title
                  }
                />

                <ComparisonCard
                  label="Content Size"
                  value={
                    result.comparison?.contentSize
                  }
                />

              </div>

            </section>


            {/* =================================================
                INDEXABILITY
            ================================================= */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <div className="mb-5 flex items-center gap-3">

                <CheckCircle2 className="h-5 w-5 text-emerald-400" />

                <h2 className="text-lg font-semibold">
                  Indexability Signals
                </h2>

              </div>

              <div className="grid gap-4 md:grid-cols-3">

                <SignalCard
                  label="Canonical"
                  value={
                    result.indexability?.canonical ||
                    "Not detected"
                  }
                />

                <SignalCard
                  label="Meta Robots"
                  value={
                    result.indexability?.metaRobots ||
                    "Not detected"
                  }
                />

                <SignalCard
                  label="X-Robots-Tag"
                  value={
                    result.indexability?.xRobotsTag ||
                    "Not detected"
                  }
                />

              </div>

            </section>


            {/* =================================================
                DISCOVERY SIGNAL
            ================================================= */}

            <section className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-6">

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <div className="mb-2 flex items-center gap-3">

                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <Radio className="h-5 w-5 text-blue-400" />
                    </div>

                    <h2 className="text-lg font-semibold">
                      Discovery Signal
                    </h2>

                  </div>

                  <p className="max-w-2xl text-sm leading-6 text-gray-400">
                    Create a public discovery page on this
                    application containing a standard
                    crawlable link to your target URL.
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    This does not guarantee Google crawling
                    or indexing. It creates a controlled
                    discovery signal for testing.
                  </p>

                </div>


                <button
                  onClick={createDiscovery}
                  disabled={discoveryLoading}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {discoveryLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      CREATING...
                    </>
                  ) : (
                    <>
                      <Radio className="h-4 w-4" />
                      CREATE DISCOVERY SIGNAL
                    </>
                  )}

                </button>

              </div>


              {/* DISCOVERY RESULT */}

              {discovery?.success && (
                <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">

                  <div className="mb-4 flex items-center gap-2">

                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />

                    <span className="font-semibold text-emerald-300">
                      Discovery page created
                    </span>

                  </div>


                  <div className="rounded-lg border border-white/10 bg-black/30 p-4">

                    <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">
                      Discovery URL
                    </p>

                    <div className="break-all text-sm text-blue-300">
                      {discovery.discoveryUrl}
                    </div>

                  </div>


                  <div className="mt-4 flex flex-wrap gap-3">

                    <button
                      onClick={copyDiscoveryUrl}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
                    >

                      <Copy className="h-4 w-4" />

                      {copyMessage || "Copy URL"}

                    </button>


                    <a
                      href={discovery.discoveryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
                    >

                      <ExternalLink className="h-4 w-4" />

                      Open Discovery Page

                    </a>

                  </div>


                  <div className="mt-4 text-xs text-gray-500">

                    Status:{" "}

                    <span className="text-emerald-400">
                      {discovery.status}
                    </span>

                  </div>

                </div>
              )}

            </section>


            {/* =================================================
                LIVE CRAWL STATUS
                THIS IS THE NEW SECTION
            ================================================= */}

            {discovery?.success && discovery.id && (
              <DiscoveryStatus
                discoveryId={discovery.id}
              />
            )}


            {/* =================================================
                GOOGLE SEARCH CHECK
            ================================================= */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                <div>

                  <h2 className="font-semibold">
                    Google Search Check
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Open a Google search for the exact target
                    URL and manually check whether it appears.
                  </p>

                </div>


                <button
                  onClick={openGoogleCheck}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
                >

                  <Search className="h-4 w-4" />

                  CHECK GOOGLE

                  <ExternalLink className="h-4 w-4" />

                </button>

              </div>

            </section>


            {/* =================================================
                WARNING
            ================================================= */}

            <div className="flex gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">

              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />

              <div className="text-sm leading-6 text-gray-400">

                <strong className="text-yellow-300">
                  Important:
                </strong>{" "}

                this prototype measures HTTP accessibility
                and creates a crawlable discovery path. It
                does not have an official generic Google API
                that can force arbitrary URLs into Google's
                index.

              </div>

            </div>

          </div>
        )}


        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="mt-12 border-t border-white/5 pt-6 text-center text-xs text-gray-600">

          URL Discovery & Crawl Analyzer — Experimental Prototype

        </div>

      </div>
    </main>
  );
}


/* ============================================================
   COMPONENTS
   ============================================================ */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/5 pb-3 last:border-0">

      <span className="text-xs uppercase tracking-wider text-gray-500">
        {label}
      </span>

      <span className="break-all text-gray-300">
        {value}
      </span>

    </div>
  );
}


function ComparisonCard({
  label,
  value,
}: {
  label: string;
  value?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">

      <div className="mb-3 flex items-center justify-between">

        <span className="text-sm text-gray-400">
          {label}
        </span>

        {value ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : (
          <XCircle className="h-5 w-5 text-red-400" />
        )}

      </div>

      <div
        className={`text-sm font-semibold ${
          value
            ? "text-emerald-400"
            : "text-red-400"
        }`}
      >
        {value ? "MATCH" : "DIFFERENT"}
      </div>

    </div>
  );
}


function SignalCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">

      <div className="mb-2 text-xs uppercase tracking-wider text-gray-500">
        {label}
      </div>

      <div className="break-all text-sm text-gray-300">
        {value}
      </div>

    </div>
  );
}