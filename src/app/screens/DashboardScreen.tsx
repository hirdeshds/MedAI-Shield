import { useEffect, useState } from "react";
import { Database, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { DashboardMetrics, getDashboardMetrics } from "../lib/api";

export function DashboardScreen() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getDashboardMetrics();
        if (isMounted) {
          setMetrics(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch dashboard metrics:", err);
          setError("Failed to load dashboard metrics. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Portal Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time healthcare data ingestion and validation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-4">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading recent activity...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Portal Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time healthcare data ingestion and validation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Database}
          label="Total Records Processed"
          value={metrics?.summary.totalProcessed.toLocaleString() ?? "0"}
          delta="Live from AWS"
          deltaType="positive"
        />
        <StatCard
          icon={AlertTriangle}
          label="Compliance Risks Blocked"
          value={metrics?.summary.complianceRisksBlocked.toString() ?? "0"}
          delta={`${metrics?.summary.aiIdentifiedHighRisk ?? 0} high-risk patients`}
          deltaType="negative"
        />
        <StatCard
          icon={ShieldCheck}
          label="Compliance Score"
          value={metrics?.summary.overallComplianceScore ?? "N/A"}
          delta="Calculated by API"
          deltaType="positive"
        />
      </div>

      {error && (
        <div className="p-4 bg-risk/10 border border-risk/20 rounded-lg text-sm text-risk">
          {error}
        </div>
      )}

      <Card className="border-l-2 border-l-teal">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics?.recentActivity.length ? (
            <div className="space-y-4">
              {metrics.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm text-primary">
                        {activity.id}
                      </span>
                      <StatusBadge status={activity.status} />
                    </div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      File: {activity.file}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No ingestion activity yet. Upload a CSV or JSON file to populate this feed.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
