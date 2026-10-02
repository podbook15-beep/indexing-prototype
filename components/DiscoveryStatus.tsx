"use client";

import {
  Activity,
  Bot,
  CheckCircle2,
  Clock3,
  Globe,
  Loader2,
  Radio,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from "lucide-react";

import { useEffect, useState } from "react";

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

type StatusResponse = {
  success?: boolean;

  status?: {
    submitted: boolean;
    targetAccessible: boolean;
    discoveryCreated: boolean;
    discoveryVisited: boolean;
    googlebotDetected: boolean;
    googleSearchObserved: boolean | null;

    targetUrl: string;
    discoveryId: string;
    createdAt: string;

    crawlerStats: {
      total: number;
      browser: number;
      googlebot: number;
      other: number;
    };

    latestEvent: TelemetryEvent | null;

    latestGooglebotEvent:
      | TelemetryEvent
      | null;

    events: TelemetryEvent[];
  };

  error?: string;
};

type Props = {
  discoveryId?: string;
};

function formatTime(
  timestamp?: string
) {
  if (!timestamp) return "—";

  return new Date(
    timestamp
  ).toLocaleString();
}

function StatusIcon({
  active,
}: {
  active: boolean;
}) {
  if (active) {
    return (
      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
    );
  }

  return (
    <Clock3 className="h-5 w-5 text-gray-500" />
  );
}

function StatusRow({
  label,
  description,
  active,
}: {
  label: string;
  description: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.025] p-4">
      <div className="flex items-center gap-3">
        <StatusIcon active={active} />

        <div>
          <div className="text-sm font-medium">
            {label}
          </div>

          <div className="mt-1 text-xs text-gray-500">
            {description}
          </div>
        </div>
      </div>

      <div
        className={
          active
            ? "text-xs font-semibold text-emerald-400"
            : "text-xs text-gray-600"
        }
      >
        {active ? "DETECTED" : "WAITING"}
      </div>
    </div>
  );
}

export default function DiscoveryStatus({
  discoveryId,
}: Props) {
  const [data, setData] =
    useState<StatusResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState<string>("");

  const [error, setError] =
    useState("");

  async function loadStatus(
    showLoader = false
  ) {
    if (!discoveryId) return;

    if (showLoader) {
      setLoading(true);
    }

    try {
      const response = await fetch(
        `/api/status/${encodeURIComponent(
          discoveryId
        )}`,
        {
          cache: "no-store",
        }
      );

      const result: StatusResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Unable to load status."
        );
      }

      setData(result);

      setLastUpdated(
        new Date().toLocaleTimeString()
      );

      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load status."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!discoveryId) return;

    loadStatus(true);

    const interval = setInterval(() => {
      loadStatus(false);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [discoveryId]);

  if (!discoveryId) {
    return null;
  }

  const status = data?.status;

  return (
    <section className="mt-6 rounded-2xl border border-purple-500/20 bg-purple-500/[0.035] p-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <div className="mb-2 flex items-center gap-3">

            <div className="rounded-lg bg-purple-500/10 p-2">
              <Activity className="h-5 w-5 text-purple-400" />
            </div>

            <h2 className="text-lg font-semibold">
              Live Crawl Status
            </h2>

          </div>

          <p className="max-w-2xl text-sm leading-6 text-gray-400">
            This dashboard observes visits to your
            discovery page and identifies crawler
            User-Agent activity.
          </p>

          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">

            <span
              className={
                data?.success
                  ? "h-2 w-2 rounded-full bg-emerald-400"
                  : "h-2 w-2 rounded-full bg-gray-600"
              }
            />

            {lastUpdated
              ? `Updated ${lastUpdated}`
              : "Waiting for status..."}

          </div>
        </div>

        <button
          onClick={() =>
            loadStatus(true)
          }
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          Refresh
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* LOADING */}

      {!status && !error && (
        <div className="mt-6 flex items-center justify-center rounded-xl border border-white/5 bg-black/20 p-10">

          <div className="text-center">

            <Loader2 className="mx-auto h-7 w-7 animate-spin text-purple-400" />

            <p className="mt-3 text-sm text-gray-500">
              Loading crawl status...
            </p>

          </div>

        </div>
      )}

      {status && (
        <>
          {/* STATUS PIPELINE */}

          <div className="mt-6 space-y-3">

            <StatusRow
              label="URL Submitted"
              description="The target URL has been registered."
              active={status.submitted}
            />

            <StatusRow
              label="Target Accessible"
              description="The target was accepted by the discovery system."
              active={status.targetAccessible}
            />

            <StatusRow
              label="Discovery Created"
              description="A public discovery URL was generated."
              active={status.discoveryCreated}
            />

            <StatusRow
              label="Discovery Visited"
              description="At least one request reached the discovery page."
              active={status.discoveryVisited}
            />

            <StatusRow
              label="Googlebot Detected"
              description="A request identifying itself as Googlebot was observed."
              active={status.googlebotDetected}
            />

          </div>

          {/* CRAWLER STATISTICS */}

          <div className="mt-6">

            <div className="mb-3 flex items-center gap-2">

              <Users className="h-4 w-4 text-gray-500" />

              <h3 className="text-sm font-semibold">
                Crawler Activity
              </h3>

            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

              <div className="rounded-xl border border-white/5 bg-black/20 p-4">

                <div className="text-xs uppercase tracking-wider text-gray-600">
                  Total
                </div>

                <div className="mt-2 text-2xl font-bold">
                  {status.crawlerStats.total}
                </div>

              </div>

              <div className="rounded-xl border border-white/5 bg-black/20 p-4">

                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-600">
                  <Globe className="h-3.5 w-3.5" />
                  Browser
                </div>

                <div className="mt-2 text-2xl font-bold">
                  {status.crawlerStats.browser}
                </div>

              </div>

              <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-4">

                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-600">
                  <Bot className="h-3.5 w-3.5" />
                  Googlebot
                </div>

                <div className="mt-2 text-2xl font-bold text-emerald-400">
                  {status.crawlerStats.googlebot}
                </div>

              </div>

              <div className="rounded-xl border border-white/5 bg-black/20 p-4">

                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-600">
                  <Radio className="h-3.5 w-3.5" />
                  Other
                </div>

                <div className="mt-2 text-2xl font-bold">
                  {status.crawlerStats.other}
                </div>

              </div>

            </div>

          </div>

          {/* LATEST GOOGLEBOT */}

          <div className="mt-6">

            <div className="mb-3 flex items-center gap-2">

              <Bot className="h-4 w-4 text-emerald-400" />

              <h3 className="text-sm font-semibold">
                Googlebot Activity
              </h3>

            </div>

            {status.latestGooglebotEvent ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">

                <div className="flex items-start gap-3">

                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

                  <div className="min-w-0">

                    <div className="font-semibold text-emerald-300">
                      Googlebot request detected
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      {formatTime(
                        status.latestGooglebotEvent
                          .timestamp
                      )}
                    </div>

                    <div className="mt-3 break-all rounded-lg bg-black/30 p-3 text-xs leading-5 text-gray-500">
                      {status.latestGooglebotEvent.userAgent}
                    </div>

                  </div>

                </div>

              </div>
            ) : (
              <div className="rounded-xl border border-white/5 bg-black/20 p-5">

                <div className="flex items-center gap-3">

                  <Clock3 className="h-5 w-5 text-gray-600" />

                  <div>

                    <div className="text-sm font-medium text-gray-400">
                      No Googlebot visit observed yet
                    </div>

                    <div className="mt-1 text-xs text-gray-600">
                      The dashboard will automatically
                      update when telemetry records a
                      crawler request.
                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>

          {/* EVENT TIMELINE */}

          <div className="mt-6">

            <div className="mb-3 flex items-center gap-2">

              <Clock3 className="h-4 w-4 text-gray-500" />

              <h3 className="text-sm font-semibold">
                Event Timeline
              </h3>

            </div>

            <div className="space-y-2">

              {status.events.length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-black/20 p-5 text-sm text-gray-600">
                  No telemetry events recorded yet.
                </div>
              ) : (
                status.events.map(
                  (event) => (
                    <div
                      key={event.id}
                      className="flex gap-3 rounded-xl border border-white/5 bg-black/20 p-4"
                    >

                      <div className="mt-1">

                        {event.crawler ===
                        "Googlebot" ? (
                          <Bot className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Activity className="h-4 w-4 text-gray-500" />
                        )}

                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                          <div className="text-sm font-medium">
                            {event.event ===
                            "googlebot_visit"
                              ? "Googlebot visited discovery page"
                              : "Discovery page visited"}
                          </div>

                          <div className="text-xs text-gray-600">
                            {formatTime(
                              event.timestamp
                            )}
                          </div>

                        </div>

                        <div className="mt-1 text-xs text-gray-600">
                          Detected:
                          {" "}
                          <span className="text-gray-400">
                            {event.crawler}
                          </span>
                        </div>

                      </div>

                    </div>
                  )
                )
              )}

            </div>

          </div>

          {/* SEARCH STATUS */}

          <div className="mt-6 rounded-xl border border-white/5 bg-black/20 p-5">

            <div className="flex items-start gap-3">

              <Search className="mt-0.5 h-5 w-5 text-gray-500" />

              <div>

                <div className="text-sm font-semibold">
                  Google Search Verification
                </div>

                <p className="mt-1 text-xs leading-5 text-gray-600">
                  Googlebot activity and Google Search
                  appearance are separate observations.
                  A crawler visit does not by itself prove
                  that the target URL has been indexed.
                </p>

              </div>

            </div>

          </div>

        </>
      )}

    </section>
  );
}