import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Loader2 } from "lucide-react";

type CardState = "empty" | "loading" | "success";

interface HeroCardProps {
  state: CardState;
}

export function HeroCard({ state }: HeroCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {state === "loading" && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          {state === "success" && (
            <ClipboardList className="h-5 w-5 text-primary" />
          )}
          {state === "empty" && (
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          )}
          {state === "loading"
            ? "Loading Briefing"
            : state === "success"
              ? "API Response (Placeholder)"
              : "Briefing"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {state === "empty" && <EmptyState />}
        {state === "loading" && <LoadingState />}
        {state === "success" && <SuccessState />}
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

function SuccessState() {
  const mockResponse = {
    topic: "Air Quality",
    status: "Verified",
    summary: "Placeholder response.",
  };

  return (
    <div className="rounded-lg bg-muted p-4">
      <pre className="overflow-x-auto text-sm leading-relaxed text-muted-foreground">
        <code>{JSON.stringify(mockResponse, null, 2)}</code>
      </pre>
    </div>
  );
}
