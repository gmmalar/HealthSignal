import { Activity } from "lucide-react";

export function Header() {
  return (
    <header className="w-full border-b border-border bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              HealthSignal
            </h1>
            <p className="text-sm text-muted-foreground">
              Public health intelligence made simple.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
