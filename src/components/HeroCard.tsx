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
}

export function HeroCard({ status, data, message }: HeroCardProps) {
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
          />
        )}
        {status === "error" && (
          <MessageState
            message={
              message ??
              "Something went wrong generating this briefing. Please try again."
            }
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
  const freshness = typeof data.freshness === "string" ? data.freshness : null;
  const lastUpdated = typeof data.lastUpdated === "string" ? data.lastUpdated : null;
  const latestUpdate = freshness || lastUpdated || "—";

  const statusValue = typeof data.status === "string" ? data.status : "Verified";
  const isVerified = statusValue === "Verified";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isVerified
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
          }`}
        >
          {isVerified ? "Verified" : statusValue}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Latest Update
        </p>
        <p className="text-sm text-foreground">{latestUpdate}</p>
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
        Show Technical Details
        {showDetails ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {showDetails && (
        <div className="space-y-4 rounded-lg border border-border p-4">
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

function MessageState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
