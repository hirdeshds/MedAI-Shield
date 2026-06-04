/**
 * MedAI Shield frontend data layer.
 * This app is intentionally frontend-only now: no backend proxy and no AWS
 * secret keys in browser code.
 */

type RawRecord = Record<string, unknown>;
const LOCAL_UPLOADS_KEY = "medai-shield:uploads";
const LOCAL_SNS_SUBSCRIBERS_KEY = "medai-shield:sns-subscribers";
const LOCAL_SNS_ALERTS_KEY = "medai-shield:sns-alerts";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DashboardMetrics {
  summary: {
    totalProcessed: number;
    complianceRisksBlocked: number;
    aiIdentifiedHighRisk: number;
    overallComplianceScore: string;
  };
  patientTable: Array<{
    patientId: string;
    department: string;
    aiRiskScore: string;
    status: "Critical Flag" | "Stable";
  }>;
  chartData: Array<{
    name: string;
    processed: number;
  }>;
  recentActivity: Array<{
    id: string;
    timestamp: string;
    status: "validated" | "quarantined" | "failed" | "processing";
    action: string;
    file: string;
    sizeBytes: number;
    aws?: unknown;
  }>;
  aws?: {
    dashboard?: unknown;
    etl?: unknown;
    monitoring?: unknown;
    curated?: unknown;
    lifecycle?: unknown;
  };
}

export interface UploadResponse {
  status: string;
  fileName: string;
  eventId: string;
  message: string;
  recordCount: number;
  storedAt: string;
  aws?: unknown;
}

export interface ApiRouteSnapshot {
  key: string;
  label: string;
  method: "GET" | "POST";
  url: string;
  status: "online" | "offline" | "action";
  updatedAt: string;
  payload?: unknown;
  error?: string;
}

interface LocalUploadEvent {
  eventId: string;
  fileName: string;
  sizeBytes: number;
  recordCount: number;
  uploadedAt: string;
  status: "validated" | "quarantined" | "failed" | "processing";
  previewPatients: DashboardMetrics["patientTable"];
}

export interface AuditLog {
  timestamp: string;
  user: string;
  action: string;
  fileId: string;
  cloudTrailRef: string;
  actionType: "create" | "read" | "update" | "delete";
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  raw?: unknown;
}

export interface QuarantineResponse {
  count: number;
  records: unknown[];
  raw?: unknown;
}

export interface SnsStatus {
  service: string;
  configured: boolean;
  region: string;
  topicArn: string | null;
  lastCheckedAt: string;
  actions: string[];
}

export interface SnsPublishResponse {
  status: string;
  messageId?: string;
  topicArn: string;
  sentAt: string;
}

export interface SnsSubscribeResponse {
  status: string;
  subscriptionArn?: string;
  topicArn: string;
  protocol: "email" | "sms";
  endpoint: string;
}

export type LoginRole = "doctor" | "analyst" | "admin";

export interface AuthUser {
  email: string;
  name: string;
  role: LoginRole;
  title: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  role: LoginRole;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// ============================================================================
// ENVIRONMENT & CONFIGURATION
// ============================================================================

const env = import.meta.env;

const demoUsers: Record<string, AuthUser & { password: string }> = {
  "doctor@hospital.com": {
    email: "doctor@hospital.com",
    password: "doctor123",
    name: "Dr. Aisha Rao",
    role: "doctor",
    title: "Attending Doctor",
  },
  "analyst@hospital.com": {
    email: "analyst@hospital.com",
    password: "analyst123",
    name: "Data Analyst",
    role: "analyst",
    title: "Clinical Data Analyst",
  },
  "admin@hospital.com": {
    email: "admin@hospital.com",
    password: "admin123",
    name: "Admin User",
    role: "admin",
    title: "Hospital Admin",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function asRecord(value: unknown): RawRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RawRecord)
    : {};
}

function asArray(value: unknown, keys: string[] = []): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  for (const key of keys) {
    const nested = record[key];
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

function asNumber(value: unknown, fallback = 0): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeStatus(value: unknown): "validated" | "quarantined" | "failed" | "processing" {
  const status = asString(value).toLowerCase();
  if (status.includes("quarantine")) return "quarantined";
  if (status.includes("fail") || status.includes("error")) return "failed";
  if (status.includes("process") || status.includes("run")) return "processing";
  return "validated";
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readLocalUploadEvents(): LocalUploadEvent[] {
  if (typeof window === "undefined") return [];

  const parsed = safeJsonParse(window.localStorage.getItem(LOCAL_UPLOADS_KEY) ?? "[]");
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => asRecord(item))
    .map((item) => ({
      eventId: asString(item.eventId),
      fileName: asString(item.fileName, "uploaded-file"),
      sizeBytes: asNumber(item.sizeBytes),
      recordCount: asNumber(item.recordCount, 1),
      uploadedAt: asString(item.uploadedAt, new Date().toISOString()),
      status: normalizeStatus(item.status),
      previewPatients: asArray(item.previewPatients).map((patient, index) => {
        const record = asRecord(patient);
        return {
          patientId: asString(record.patientId, `LOCAL-${index + 1}`),
          department: asString(record.department, "Uploaded file"),
          aiRiskScore: asString(record.aiRiskScore, "0"),
          status: asString(record.status).toLowerCase().includes("critical")
            ? ("Critical Flag" as const)
            : ("Stable" as const),
        };
      }),
    }))
    .filter((item) => item.eventId);
}

function saveLocalUploadEvent(event: LocalUploadEvent) {
  if (typeof window === "undefined") return;

  const existing = readLocalUploadEvents();
  const next = [event, ...existing.filter((item) => item.eventId !== event.eventId)].slice(0, 25);
  window.localStorage.setItem(LOCAL_UPLOADS_KEY, JSON.stringify(next));
}

function parseDelimitedRows(content: string): RawRecord[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return headers.reduce<RawRecord>((record, header, index) => {
      record[header] = values[index] ?? "";
      return record;
    }, {});
  });
}

function extractRowsFromFile(fileContent: string, fileName: string): RawRecord[] {
  if (fileName.toLowerCase().endsWith(".json")) {
    const parsed = safeJsonParse(fileContent);
    return asArray(parsed, ["records", "patients", "items", "data"]).map(asRecord);
  }

  return parseDelimitedRows(fileContent);
}

function normalizePatientRows(rows: RawRecord[]): DashboardMetrics["patientTable"] {
  return rows.slice(0, 25).map((record, index) => {
    const score = record.aiRiskScore ?? record.riskScore ?? record.score ?? record.readmissionRisk ?? "0";
    const status = asString(record.status ?? record.riskLevel).toLowerCase();

    return {
      patientId: asString(record.patientId ?? record.patient_id ?? record.id ?? record.recordId, `UPLOAD-${index + 1}`),
      department: asString(record.department ?? record.dept ?? record.specialty, "Uploaded file"),
      aiRiskScore: String(score),
      status: status.includes("critical") || status.includes("high")
        ? "Critical Flag"
        : "Stable",
    };
  });
}

function normalizeDashboard(
  dashboardPayload: unknown,
  etlPayload: unknown,
  monitoringPayload: unknown,
  curatedPayload: unknown,
  lifecyclePayload: unknown,
): DashboardMetrics {
  const dashboard = asRecord(dashboardPayload);
  const summary = asRecord(dashboard.summary ?? dashboard.stats ?? dashboard);
  const curatedRecords = asArray(curatedPayload, ["records", "items", "data", "curated"]);
  const localUploads = readLocalUploadEvents();
  const localPatients = localUploads.flatMap((upload) => upload.previewPatients);
  const patientTable = asArray(dashboard.patientTable, ["patients", "records", "items", "data"]);
  const chartData = asArray(dashboard.chartData, ["chartData", "processedOverTime", "volume"]);
  const recentActivity = asArray(dashboard.recentActivity, ["activity", "events", "items"]);
  const monitoring = asRecord(monitoringPayload);
  const normalizedPatients = patientTable.length
    ? patientTable
    : curatedRecords.length
      ? curatedRecords
      : localPatients;
  const localRecordCount = localUploads.reduce((total, upload) => total + upload.recordCount, 0);
  const localActivity = localUploads.map((upload) => ({
    id: upload.eventId,
    timestamp: upload.uploadedAt,
    status: upload.status,
    action: "FILE_UPLOAD",
    file: upload.fileName,
    sizeBytes: upload.sizeBytes,
    aws: upload,
  }));

  return {
    summary: {
      totalProcessed: asNumber(
        summary.totalProcessed ?? summary.total_records ?? summary.recordsProcessed,
        curatedRecords.length || localRecordCount,
      ),
      complianceRisksBlocked: asNumber(
        summary.complianceRisksBlocked ?? summary.risksBlocked ?? monitoring.alarmCount,
      ),
      aiIdentifiedHighRisk: asNumber(
        summary.aiIdentifiedHighRisk ?? summary.highRisk ?? summary.high_risk,
        localPatients.filter((patient) => patient.status === "Critical Flag").length,
      ),
      overallComplianceScore: asString(
        summary.overallComplianceScore ?? summary.complianceScore ?? summary.score,
        "N/A",
      ),
    },
    patientTable: normalizedPatients.map((item, index) => {
      const record = asRecord(item);
      const score = record.aiRiskScore ?? record.riskScore ?? record.score ?? "0";

      return {
        patientId: asString(record.patientId ?? record.id ?? record.recordId, `REC-${index + 1}`),
        department: asString(record.department ?? record.timestamp ?? record.createdAt, "N/A"),
        aiRiskScore: String(score),
        status:
          asString(record.status).toLowerCase().includes("critical") ||
          asString(record.status).toLowerCase().includes("high")
            ? "Critical Flag"
            : "Stable",
      };
    }),
    chartData: (chartData.length ? chartData : localUploads).map((item, index) => {
      const record = asRecord(item);
      return {
        name: asString(record.name ?? record.date ?? record.day ?? record.fileName, `Point ${index + 1}`),
        processed: asNumber(record.processed ?? record.count ?? record.total ?? record.recordCount, 1),
      };
    }),
    recentActivity: [...localActivity, ...recentActivity.map((item, index) => {
      const record = asRecord(item);
      return {
        id: asString(record.id ?? record.eventId, `EVT-${index + 1}`),
        timestamp: asString(record.timestamp ?? record.createdAt, new Date().toISOString()),
        status: normalizeStatus(record.status),
        action: asString(record.action ?? record.eventName, "AWS event received"),
        file: asString(record.file ?? record.fileName ?? record.key, "N/A"),
        sizeBytes: asNumber(record.sizeBytes ?? record.size),
        aws: record,
      };
    })],
    aws: {
      dashboard: dashboardPayload,
      etl: etlPayload,
      monitoring: monitoringPayload,
      curated: curatedPayload,
      lifecycle: lifecyclePayload,
    },
  };
}

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const user = demoUsers[payload.email.toLowerCase()];

  if (!user || user.password !== payload.password || user.role !== payload.role) {
    throw new Error("Invalid email, password, or role");
  }

  const { password: _password, ...publicUser } = user;
  const response: LoginResponse = {
    token: window.crypto.randomUUID(),
    user: publicUser,
  };

  return response;
}

export async function logoutUser(_token?: string): Promise<{ status: string }> {
  return { status: "logged_out" };
}

// ============================================================================
// DASHBOARD API
// ============================================================================

/**
 * Get dashboard metrics from local uploads and frontend-only state.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return normalizeDashboard(
    {
      summary: {
        totalProcessed: 0,
        complianceRisksBlocked: 0,
        aiIdentifiedHighRisk: 0,
        overallComplianceScore: "Local",
      },
    },
    {},
    {},
    {},
    {},
  );
}

// ============================================================================
// FILE UPLOAD API
// ============================================================================

/**
 * Upload patient data file
 * Reads file as text and POSTs with correct Content-Type
 */
export async function uploadPatientData(file: File): Promise<UploadResponse> {
  try {
    const fileContent = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });

    const eventId = window.crypto.randomUUID();
    const uploadedAt = new Date().toISOString();
    const rows = extractRowsFromFile(fileContent, file.name);
    const previewPatients = normalizePatientRows(rows);
    const recordCount = rows.length || 1;

    saveLocalUploadEvent({
      eventId,
      fileName: file.name,
      sizeBytes: file.size,
      recordCount,
      uploadedAt,
      status: "validated",
      previewPatients,
    });

    return {
      status: "Success",
      fileName: file.name,
      eventId,
      message: "File processed locally in the frontend workspace.",
      recordCount,
      storedAt: uploadedAt,
      aws: { mode: "frontend-only" },
    };
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
}

// ============================================================================
// AUDIT LOG API
// ============================================================================

export async function getAuditLogs(): Promise<AuditLogsResponse> {
  const uploads = readLocalUploadEvents();
  return {
    logs: uploads.map((upload) => ({
      timestamp: upload.uploadedAt,
      user: "admin",
      action: "LOCAL_FILE_UPLOAD",
      fileId: upload.fileName,
      cloudTrailRef: upload.eventId,
      actionType: "create",
    })),
    raw: { mode: "frontend-only" },
  };
}

// ============================================================================
// QUARANTINE API
// ============================================================================

export async function getQuarantine(): Promise<QuarantineResponse> {
  const records = readLocalUploadEvents()
    .flatMap((upload) => upload.previewPatients)
    .filter((patient) => patient.status === "Critical Flag");

  return {
    count: records.length,
    records,
    raw: { mode: "frontend-only" },
  };
}

// ============================================================================
// ETL API
// ============================================================================

export async function getEtlStatus(): Promise<RawRecord> {
  return {
    status: "LOCAL_READY",
    lastRun: new Date().toISOString(),
    recordsProcessed: readLocalUploadEvents().reduce((total, upload) => total + upload.recordCount, 0),
  };
}

export async function runEtl(): Promise<RawRecord> {
  return {
    status: "completed",
    jobId: window.crypto.randomUUID(),
    mode: "frontend-only",
  };
}

// ============================================================================
// MONITORING API
// ============================================================================

export async function getMonitoringStatus(): Promise<RawRecord> {
  return {
    status: "healthy",
    mode: "frontend-only",
    localUploads: readLocalUploadEvents().length,
  };
}

export async function getQualityStatus(): Promise<RawRecord> {
  const uploads = readLocalUploadEvents();
  return {
    qualityScore: uploads.length ? 98.5 : 100,
    duplicates: 0,
    missingValues: 0,
    status: "PASS",
  };
}

export async function getIamUsers(): Promise<RawRecord> {
  return {
    users: [
      { username: "admin", role: "Administrator" },
      { username: "analyst-priya", role: "Analyst" },
      { username: "dr-sharma", role: "Doctor" },
    ],
  };
}

export async function getCuratedRecords(): Promise<RawRecord> {
  return { records: readLocalUploadEvents().flatMap((upload) => upload.previewPatients) };
}

export async function getLifecycleStatus(): Promise<RawRecord> {
  return {
    bronze: "LOCAL",
    silver: "LOCAL",
    gold: "LOCAL",
  };
}

export async function getApiRouteSnapshots(): Promise<ApiRouteSnapshot[]> {
  const updatedAt = new Date().toISOString();
  return [
    { key: "dashboard", label: "Dashboard", method: "GET", url: "localStorage", status: "online", updatedAt },
    { key: "upload", label: "Upload", method: "POST", url: "FileReader", status: "action", updatedAt },
    { key: "sns", label: "SNS Alerts", method: "POST", url: "frontend-only", status: "action", updatedAt },
    { key: "audit", label: "Audit Logs", method: "GET", url: "localStorage", status: "online", updatedAt },
  ];
}

// ============================================================================
// SNS ALERTS
// ============================================================================

export async function getSnsStatus(): Promise<SnsStatus> {
  const topicArn = asString(env.VITE_AWS_SNS_TOPIC_ARN);
  return {
    service: "Amazon SNS",
    configured: Boolean(topicArn),
    region: asString(env.VITE_AWS_REGION, "ap-south-1"),
    topicArn: topicArn || null,
    lastCheckedAt: new Date().toISOString(),
    actions: topicArn ? ["local-preview"] : [],
  };
}

export async function publishSnsAlert(payload: {
  subject: string;
  message: string;
}): Promise<SnsPublishResponse> {
  const status = await getSnsStatus();
  const alert = {
    id: window.crypto.randomUUID(),
    ...payload,
    sentAt: new Date().toISOString(),
    topicArn: status.topicArn ?? "frontend-only",
  };
  const existing = asArray(safeJsonParse(window.localStorage.getItem(LOCAL_SNS_ALERTS_KEY) ?? "[]"));
  window.localStorage.setItem(LOCAL_SNS_ALERTS_KEY, JSON.stringify([alert, ...existing].slice(0, 25)));

  return {
    status: status.configured ? "queued-locally" : "saved-locally",
    messageId: alert.id,
    topicArn: alert.topicArn,
    sentAt: alert.sentAt,
  };
}

export async function subscribeToSns(payload: {
  protocol: "email" | "sms";
  endpoint: string;
}): Promise<SnsSubscribeResponse> {
  const status = await getSnsStatus();
  const subscription = {
    ...payload,
    subscriptionArn: `local:${window.crypto.randomUUID()}`,
    topicArn: status.topicArn ?? "frontend-only",
  };
  const existing = asArray(safeJsonParse(window.localStorage.getItem(LOCAL_SNS_SUBSCRIBERS_KEY) ?? "[]"));
  window.localStorage.setItem(LOCAL_SNS_SUBSCRIBERS_KEY, JSON.stringify([subscription, ...existing].slice(0, 25)));

  return {
    status: "saved_locally",
    subscriptionArn: subscription.subscriptionArn,
    topicArn: subscription.topicArn,
    protocol: payload.protocol,
    endpoint: payload.endpoint,
  };
}
