import { useEffect, useState } from "react";
import { Activity, Loader2, Play, RefreshCw, Server } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ApiRouteSnapshot, getApiRouteSnapshots, runEtl } from "../lib/api";
import { cn } from "../components/ui/utils";

const statusStyles: Record<ApiRouteSnapshot["status"], string> = {
  online: "bg-teal/20 text-teal border-teal",
  offline: "bg-risk/20 text-risk border-risk",
  action: "bg-amber/20 text-amber border-amber",
};

function formatPayload(payload: unknown) {
  if (payload === undefined) return "No payload";
  return JSON.stringify(payload, null, 2);
}

export function AwsRoutesScreen() {
  const [routes, setRoutes] = useState<ApiRouteSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningEtl, setRunningEtl] = useState(false);
  const [message, setMessage] = useState("");

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setMessage("");
      const snapshots = await getApiRouteSnapshots();
      setRoutes(snapshots);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load API route status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoutes();
  }, []);

  const handleRunEtl = async () => {
    try {
      setRunningEtl(true);
      setMessage("Starting ETL run...");
      const response = await runEtl();
      setMessage(`ETL run requested: ${JSON.stringify(response)}`);
      await loadRoutes();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ETL run failed.");
    } finally {
      setRunningEtl(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">AWS Routes</h1>
          <p className="text-muted-foreground">
            Live status for configured API Gateway routes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadRoutes} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={handleRunEtl} disabled={runningEtl}>
            {runningEtl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run ETL
          </Button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-muted/30 border border-border rounded-lg text-sm text-muted-foreground">
          {message}
        </div>
      )}

      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking AWS routes...
            </CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {routes.map((route) => (
            <Card key={route.key} className="border-l-2 border-l-teal">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Server className="w-4 h-4 text-primary" />
                      {route.label}
                    </CardTitle>
                    <p className="mt-2 text-xs font-mono text-muted-foreground break-all">
                      {route.method} {route.url}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("uppercase", statusStyles[route.status])}
                  >
                    {route.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="w-3.5 h-3.5" />
                  {new Date(route.updatedAt).toLocaleString()}
                </div>
              </CardHeader>
              <CardContent>
                {route.error ? (
                  <p className="text-sm text-risk">{route.error}</p>
                ) : (
                  <pre className="max-h-72 overflow-auto rounded bg-black/30 p-4 text-xs text-foreground/80">
                    {formatPayload(route.payload)}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
