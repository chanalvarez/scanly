import { Settings, Database, Wifi, Bell, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const settingsSections = [
  {
    icon: Database,
    title: "Database",
    description: "Supabase connection settings",
    badge: "Connected",
    badgeVariant: "success" as const,
  },
  {
    icon: Wifi,
    title: "Offline Mode",
    description: "Cache inventory for offline access",
    badge: "PWA Ready",
    badgeVariant: "secondary" as const,
  },
  {
    icon: Bell,
    title: "Low Stock Alerts",
    description: "Get notified when stock falls below 5",
    badge: "Coming soon",
    badgeVariant: "outline" as const,
  },
  {
    icon: Smartphone,
    title: "Scanner Settings",
    description: "Camera preferences and scan speed",
    badge: "Coming soon",
    badgeVariant: "outline" as const,
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Configure your Scanly app
        </p>
      </div>

      {/* App info card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Scanly</CardTitle>
              <p className="text-xs text-muted-foreground">
                Inventory Manager v0.1.0
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Settings list */}
      <div className="flex flex-col gap-2">
        {settingsSections.map(({ icon: Icon, title, description, badge, badgeVariant }) => (
          <Card key={title} className="cursor-pointer transition-colors active:bg-accent">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Badge variant={badgeVariant} className="shrink-0 text-[10px]">
                {badge}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Supabase env hint */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Setup:</span> Add your{" "}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[11px]">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            and{" "}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[11px]">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            to your{" "}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[11px]">
              .env.local
            </code>{" "}
            file to connect to Supabase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
