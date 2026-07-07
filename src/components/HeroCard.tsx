import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ClipboardList, Loader2, XCircle } from "lucide-react";

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
}

export function HeroCard({ status, data }: HeroCardProps) {
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
          <MessageState message="No verified data is currently available for this selection." />
        )}
        {status === "error" && (
           <MessageState message="Something went wrong generating this briefing. Please try again." />
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
        Choose a state and health topic to generate a public health briefing.
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
  return (
    <div className="rounded-lg bg-muted p-4">
      <pre className="overflow-x-auto text-sm leading-relaxed text-muted-foreground">
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
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
