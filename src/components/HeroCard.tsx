import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ClipboardList, Loader2, XCircle, ChevronDown, ChevronUp } from "lucide-react";

export type BriefingStatus =
  | "empty"
  | "loading"
  | "success"
  | "partial"
  | "unavailable"
  | "error";

interface HeroCardProps {
  status: BriefingStatus;
  data: Record<string, unknown> | null;
  message?: string;
  freshnessInfo?: {
    status: "Verified" | "Recent" | "Stale" | "Unavailable";
    badge: string;
  };
}

export function HeroCard({ status, data, message, freshnessInfo }: HeroCardProps) {
  const title =
    status === "loading"
      ? "Loading Briefing"
      : status === "success"
        ? "Health Briefing"
        : status === "partial"
          ? "Partial Briefing"
          : status === "unavailable"
            ? "Briefing Unavailable"
            : status === "error"
              ? "Something Went Wrong"
              : "Briefing";

  const Icon =
    status === "loading"
      ? Loader2
      : status === "error" || status === "unavailable"
        ? XCircle
        : status === "partial"
          ? AlertTriangle
          : ClipboardList;

  const iconClass =
    status === "loading"
      ? "h-5 w-5 animate-spin text-primary"
      : status === "success"
        ? "h-5 w-5 text-primary"
        : status === "partial"
          ? "h-5 w-5 text-amber-600"
          : status === "error" || status === "unavailable"
            ? "h-5 w-5 text-destructive"
            : "h-5 w-5 text-muted-foreground";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className={iconClass} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status === "empty" && <EmptyState />}
        {status === "loading" && <LoadingState />}
        {(status === "success" || status === "partial") && data && (
          <DataState data={data} />
        )}
        {status === "unavailable" && (
          <MessageState
            message={
              message ??
              "No verified data is currently available for this selection."
            }
            freshnessInfo={freshnessInfo}
          />
        )}
        {status === "error" && (
          <MessageState
            message={
              message ??
              "Something went wrong generating this briefing. Please try again."
            }
            freshnessInfo={freshnessInfo}
          />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
      <p className="mt-4 text-sm text-muted-foreground">
        Select a state and health topic, then click Generate Briefing to receive the latest verified public health summary.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">
        Fetching latest verified public health data...
      </p>
      <div className="mt-6 w-full max-w-md space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

function DataState({ data }: { data: Record<string, unknown> }) {
  const [showDetails, setShowDetails] = useState(false);

  const summary = typeof data.summary === "string" ? data.summary : null;
  const generatedBy = typeof data.generatedBy === "string" ? data.generatedBy : null;
  const freshnessInfo =
    (data.freshnessInfo as
      | {
          status: "Verified" | "Recent" | "Stale" | "Unavailable";
          badge: string;
        }
      | undefined) ?? undefined;
  const freshnessStatus = freshnessInfo?.status ?? "Verified";
  const freshnessBadge =
    freshnessInfo?.badge ??
    (typeof data.freshness === "string" && data.freshness
      ? data.freshness
      : typeof data.lastUpdated === "string" && data.lastUpdated
        ? data.lastUpdated
        : "—");

  const trendInfo =
    (data.trendInfo as
      | {
          supported: boolean;
          direction?: string;
          strength?: string;
          consecutivePeriods?: number;
        }
      | undefined) ?? undefined;
  const alertInfo =
    (data.alertInfo as
      | { level: string; reason: string }
      | undefined) ?? undefined;

  const dotClass =
    freshnessStatus === "Verified"
      ? "bg-emerald-500"
      : freshnessStatus === "Recent"
        ? "bg-amber-500"
        : freshnessStatus === "Stale"
          ? "bg-red-500"
          : "bg-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`}
          aria-hidden="true"
        />
        <span className="text-sm font-medium leading-none text-foreground">
          {freshnessStatus}
        </span>
        <span className="text-sm leading-none text-muted-foreground">·</span>
        <span className="text-sm leading-none text-muted-foreground">{freshnessBadge}</span>
      </div>

      {summary && (
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-base leading-relaxed text-foreground">{summary}</p>
          {generatedBy && (
            <p className="mt-2 text-xs text-muted-foreground">
              Generated by {generatedBy}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowDetails((prev) => !prev)}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-expanded={showDetails}
      >
        Technical Details & AI Reasoning
        {showDetails ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {showDetails && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              AI Pipeline
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ Freshness Agent — {freshnessBadge}</li>
              <li>
                ✓ Trend Agent —{" "}
                {trendInfo?.supported
                  ? `${trendInfo.direction}, ${trendInfo.strength} strength, ${trendInfo.consecutivePeriods} consecutive periods`
                  : "Not available for this topic"}
              </li>
              <li>
                ✓ Alert Agent — {alertInfo?.level ?? "—"} · {alertInfo?.reason ?? "—"}
              </li>
              <li>✓ Health Topic Agent (Claude) — Summary generated</li>
            </ul>
          </div>
          <JsonBlock title="Raw JSON" value={data.rawData ?? null} />
          <JsonBlock title="Normalized Data" value={data.normalizedData ?? null} />
          <JsonBlock title="API Response" value={data} />
        </div>
      )}
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="rounded-lg bg-muted p-4">
        <pre className="overflow-x-auto text-sm leading-relaxed text-muted-foreground">
          <code>{JSON.stringify(value, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
}

function MessageState({
  message,
  freshnessInfo,
}: {
  message: string;
  freshnessInfo?: {
    status: "Verified" | "Recent" | "Stale" | "Unavailable";
    badge: string;
  };
}) {
  const freshnessStatus = freshnessInfo?.status ?? "Unavailable";
  const freshnessBadge = freshnessInfo?.badge ?? "—";

  return (
    <div className="space-y-4 py-8 text-center">
      <div className="flex items-center justify-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-foreground">
          {freshnessStatus}
        </span>
        <span className="text-sm text-muted-foreground">·</span>
        <span className="text-sm text-muted-foreground">{freshnessBadge}</span>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
