import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Download, Search, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { cn } from "../components/ui/utils";
import { AuditLog, getAuditLogs, getQuarantine } from "../lib/api";

const fallbackAuditLogs: AuditLog[] = [
  {
    timestamp: "2026-05-28 14:32:15.847",
    user: "admin@hospital.com",
    action: "FILE_UPLOAD",
    fileId: "FILE-2847",
    cloudTrailRef: "CT-9a8f7e6d5c4b",
    actionType: "create" as const,
  },
  {
    timestamp: "2026-05-28 14:28:03.124",
    user: "validator@hospital.com",
    action: "RECORD_QUARANTINE",
    fileId: "FILE-2846",
    cloudTrailRef: "CT-8b7a6f5e4d3c",
    actionType: "update" as const,
  },
  {
    timestamp: "2026-05-28 14:21:47.592",
    user: "admin@hospital.com",
    action: "SCHEMA_VALIDATION",
    fileId: "FILE-2845",
    cloudTrailRef: "CT-7c6b5a4e3d2f",
    actionType: "read" as const,
  },
  {
    timestamp: "2026-05-28 14:15:22.318",
    user: "system@medai-shield",
    action: "ETL_FAILURE",
    fileId: "FILE-2844",
    cloudTrailRef: "CT-6d5c4b3a2e1f",
    actionType: "delete" as const,
  },
  {
    timestamp: "2026-05-28 14:09:58.761",
    user: "validator@hospital.com",
    action: "AWS_BEDROCK_CHECK",
    fileId: "FILE-2843",
    cloudTrailRef: "CT-5e4d3c2b1a0f",
    actionType: "read" as const,
  },
  {
    timestamp: "2026-05-28 13:58:31.449",
    user: "admin@hospital.com",
    action: "COMPLIANCE_AUDIT",
    fileId: "FILE-2842",
    cloudTrailRef: "CT-4f3e2d1c0b9a",
    actionType: "read" as const,
  },
  {
    timestamp: "2026-05-28 13:45:17.203",
    user: "system@medai-shield",
    action: "DATA_EXPORT",
    fileId: "FILE-2841",
    cloudTrailRef: "CT-3g2f1e0d9c8b",
    actionType: "read" as const,
  },
  {
    timestamp: "2026-05-28 13:32:54.876",
    user: "admin@hospital.com",
    action: "USER_LOGIN",
    fileId: "N/A",
    cloudTrailRef: "CT-2h1g0f9e8d7c",
    actionType: "read" as const,
  },
];

const actionTypeColors = {
  create: "bg-teal/20 text-teal border-teal",
  update: "bg-amber/20 text-amber border-amber",
  delete: "bg-risk/20 text-risk border-risk",
  read: "bg-blue-500/20 text-blue-400 border-blue-400",
};

export function AuditLogScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [quarantineCount, setQuarantineCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [auditResponse, quarantineResponse] = await Promise.all([
          getAuditLogs(),
          getQuarantine(),
        ]);

        if (!isMounted) return;

        setAuditLogs(auditResponse.logs.length ? auditResponse.logs : fallbackAuditLogs);
        setQuarantineCount(quarantineResponse.count);
      } catch (err) {
        if (!isMounted) return;

        console.error("Failed to fetch audit data:", err);
        setAuditLogs(fallbackAuditLogs);
        setQuarantineCount(null);
        setError("AWS governance services are unavailable. Showing demo audit rows.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.fileId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction =
      actionFilter === "all" || log.actionType === actionFilter;

    return matchesSearch && matchesAction;
  });

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Governance & Audit Log</h1>
          <p className="text-muted-foreground">
            Complete audit trail with CloudTrail integration
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading audit logs...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Governance & Audit Log</h1>
          <p className="text-muted-foreground">
            Complete audit trail with CloudTrail integration
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-amber/10 border border-amber/20 rounded-lg text-sm text-amber">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, action, or file ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48 bg-input">
            <SelectValue placeholder="Action Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Card className="bg-risk/10 border-risk px-4 py-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-risk" />
            <div>
              <p className="text-xs text-muted-foreground">Quarantine Zone</p>
              <p className="text-xl font-semibold font-mono text-risk">
                {quarantineCount ?? "N/A"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-l-2 border-l-teal">
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>File ID</TableHead>
                <TableHead>CloudTrail Ref ID</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length ? (
                filteredLogs.map((log, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-mono text-xs">
                      {log.timestamp}
                    </TableCell>
                    <TableCell className="text-sm">{log.user}</TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.fileId}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.cloudTrailRef}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs uppercase",
                          actionTypeColors[log.actionType]
                        )}
                      >
                        {log.actionType}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No audit logs found matching your criteria.
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
