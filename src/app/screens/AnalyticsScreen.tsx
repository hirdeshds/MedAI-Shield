import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { RiskScorePill } from "../components/RiskScorePill";
import { StatusBadge } from "../components/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";
import { DashboardMetrics, getDashboardMetrics } from "../lib/api";

export function AnalyticsScreen() {
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
          console.error("Failed to fetch analytics metrics:", err);
          setError("Failed to load analytics data. Please try again.");
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

  const backendRecords = useMemo(() => {
    if (!metrics) return [];

    return metrics.patientTable.map((patient) => {
      const score = Number.parseFloat(patient.aiRiskScore);

      return {
        id: patient.patientId,
        timestamp: patient.department,
        status: patient.status === "Critical Flag" ? ("quarantined" as const) : ("validated" as const),
        aiScore: Number.isFinite(score) ? score : 0,
      };
    });
  }, [metrics]);

  const topRiskRecords = useMemo(
    () =>
      [...backendRecords]
        .sort((left, right) => right.aiScore - left.aiScore)
        .slice(0, 5)
        .map((record) => ({ id: record.id, score: record.aiScore })),
    [backendRecords]
  );

  const highestRiskScore = topRiskRecords[0]?.score ?? null;
  const processedChartData = metrics?.chartData ?? [];

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered insights and predictive risk assessment
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading analytics data...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          AI-powered insights and predictive risk assessment
        </p>
      </div>

      {error && (
        <div className="p-4 bg-risk/10 border border-risk/20 rounded-lg text-sm text-risk">
          {error}
        </div>
      )}

      <Card className="border-l-2 border-l-risk bg-gradient-to-r from-risk/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-risk" />
            AI Risk Assessment Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-4">
                Predictive Readmission Risk
              </p>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-6xl font-mono font-semibold text-risk">
                  {highestRiskScore === null ? "N/A" : `${highestRiskScore}%`}
                </div>
                {highestRiskScore !== null && <RiskScorePill score={highestRiskScore} />}
              </div>
              <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-teal via-amber to-risk"
                  style={{ width: `${highestRiskScore ?? 0}%` }}
                />
                <div
                  className="absolute top-0 h-full w-1 bg-white"
                  style={{ left: `${highestRiskScore ?? 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>0% Low</span>
                <span>40%</span>
                <span>70%</span>
                <span>100% High</span>
              </div>
            </div>
            <Card className="flex-1 bg-card/50">
              <CardHeader>
                <CardTitle className="text-sm">
                  Top 5 Flagged Record IDs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topRiskRecords.length ? (
                  <div className="space-y-2">
                    {topRiskRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded"
                      >
                        <span className="font-mono text-sm">{record.id}</span>
                        <RiskScorePill score={record.score} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No high-risk records available.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-l-2 border-l-teal">
          <CardHeader>
            <CardTitle>Records Processed Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {processedChartData.length ? (
              <ChartContainer
                config={{
                  processed: {
                    label: "Processed",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={processedChartData}>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="processed"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                No processed records yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-2 border-l-teal">
          <CardHeader>
            <CardTitle>Processed Upload Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {processedChartData.length ? (
              <ChartContainer
                config={{
                  processed: {
                    label: "Records",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedChartData}>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="processed" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                Upload data to populate this chart.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-l-2 border-l-teal">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Records</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Paginated view of ingested data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {backendRecords.length} records
            </span>
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record ID</TableHead>
                <TableHead>Ingestion Time</TableHead>
                <TableHead>ETL Status</TableHead>
                <TableHead>AI Score</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backendRecords.length ? (
                backendRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono">{record.id}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {record.timestamp}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} />
                    </TableCell>
                    <TableCell>
                      <RiskScorePill score={record.aiScore} />
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No patient risk records available from AWS.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
