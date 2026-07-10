import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Live Public Health Data &middot; EPA AirNow, CDC NNDSS, Delphi Epidata</span>
        </div>
      </div>
    </footer>
  );
}
