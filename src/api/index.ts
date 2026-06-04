export interface DashboardResponse {
  total_raw_files: number;
  total_curated_files: number;
  valid_records: number;
  quarantined_records: number;
  pipeline_status: string;
  compliance_score: number;
  last_updated: string;
}

export interface UploadApiResponse {
  message: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  timestamp: string;
}

export interface EtlStatusResponse {
  job_runs: Array<{
    id: string;
    status: string;
    started: string;
    duration: number;
  }>;
}

export interface EtlRunResponse {
  job_run_id: string;
  status: string;
  message: string;
}

export interface QualityResponse {
  valid_files: number;
  quarantined_files: number;
  quality_score: number;
  status: string;
}

export interface MonitoringResponse {
  alarms: Array<{
    name: string;
    state: string;
    metric: string;
    description: string;
  }>;
}

export interface IamResponse {
  users: Array<{
    username: string;
    created: string;
    policies: string[];
  }>;
}

export interface AuditResponse {
  events: Array<{
    time: string;
    name: string;
    user: string;
    source: string;
  }>;
}

export interface CuratedResponse {
  files: Array<{
    key: string;
    size: number;
    last_modified: string;
  }>;
  total: number;
}

export interface LifecycleResponse {
  lifecycle_policies: Array<{
    bucket: string;
    rules: number;
    status: string;
  }>;
}

type StoredUpload = {
  eventId?: string;
  fileName?: string;
  sizeBytes?: number;
  recordCount?: number;
  uploadedAt?: string;
  status?: string;
};

const LOCAL_UPLOADS_KEY = "medai-shield:uploads";

function now() {
  return new Date().toISOString();
}

function readUploads(): StoredUpload[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_UPLOADS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function fileCountFallback(uploadCount: number, fallback: number) {
  return uploadCount > 0 ? uploadCount : fallback;
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const uploads = readUploads();
  const totalRecords = uploads.reduce((total, upload) => total + (upload.recordCount ?? 0), 0);

  return {
    total_raw_files: fileCountFallback(uploads.length, 12),
    total_curated_files: fileCountFallback(uploads.length, 9),
    valid_records: totalRecords || 1280,
    quarantined_records: uploads.filter((upload) => upload.status === "quarantined").length,
    pipeline_status: "HEALTHY",
    compliance_score: 98,
    last_updated: now(),
  };
}

export async function uploadFile(
  fileText: string,
  fileType: "csv" | "json",
): Promise<UploadApiResponse> {
  const rows =
    fileType === "json"
      ? JSON.parse(fileText || "[]")
      : fileText.split(/\r?\n/).filter((line) => line.trim()).slice(1);
  const totalRecords = Array.isArray(rows) ? rows.length : 1;
  const validRecords = Math.max(totalRecords - 1, 0);

  return {
    message: "File validated locally and queued for ingestion.",
    total_records: totalRecords,
    valid_records: validRecords,
    invalid_records: totalRecords - validRecords,
    timestamp: now(),
  };
}

export async function fetchETLStatus(): Promise<EtlStatusResponse> {
  return {
    job_runs: [
      {
        id: "local-etl-" + new Date().toISOString().slice(0, 10),
        status: "SUCCEEDED",
        started: now(),
        duration: 42,
      },
    ],
  };
}

export async function runETL(): Promise<EtlRunResponse> {
  return {
    job_run_id: crypto.randomUUID(),
    status: "SUCCEEDED",
    message: "Local ETL simulation completed.",
  };
}

export async function fetchQuality(): Promise<QualityResponse> {
  const uploads = readUploads();

  return {
    valid_files: fileCountFallback(uploads.length, 8),
    quarantined_files: uploads.filter((upload) => upload.status === "quarantined").length,
    quality_score: 96,
    status: "PASS",
  };
}

export async function fetchMonitoring(): Promise<MonitoringResponse> {
  return {
    alarms: [
      {
        name: "PHI processing latency",
        state: "OK",
        metric: "Lambda duration p95",
        description: "Clinical ingestion remains within the local simulation threshold.",
      },
      {
        name: "Quarantine growth",
        state: "OK",
        metric: "Invalid records",
        description: "No unusual spike detected in quarantined patient records.",
      },
    ],
  };
}

export async function fetchIAM(): Promise<IamResponse> {
  return {
    users: [
      {
        username: "admin",
        created: "2026-05-28T12:00:00.000Z",
        policies: ["AdministratorAccess", "AuditReadOnly"],
      },
      {
        username: "analyst-priya",
        created: "2026-05-28T12:15:00.000Z",
        policies: ["DataQualityRead", "CuratedDataRead"],
      },
      {
        username: "dr-sharma",
        created: "2026-05-28T12:30:00.000Z",
        policies: ["ClinicalTriageRead"],
      },
    ],
  };
}

export async function fetchAudit(): Promise<AuditResponse> {
  const uploads = readUploads();
  const uploadEvents = uploads.map((upload) => ({
    time: upload.uploadedAt ?? now(),
    name: "LOCAL_FILE_UPLOAD",
    user: "admin",
    source: upload.fileName ?? "localStorage",
  }));

  return {
    events: [
      ...uploadEvents,
      {
        time: now(),
        name: "Compliance dashboard opened",
        user: "system",
        source: "frontend",
      },
    ],
  };
}

export async function fetchCurated(): Promise<CuratedResponse> {
  const uploads = readUploads();
  const files = uploads.map((upload, index) => ({
    key: `curated/year=2026/month=06/day=04/${upload.fileName ?? `upload-${index + 1}.csv`}`,
    size: upload.sizeBytes ?? 0,
    last_modified: upload.uploadedAt ?? now(),
  }));

  return {
    files: files.length
      ? files
      : [
          {
            key: "curated/year=2026/month=06/day=04/demo-patients.csv",
            size: 18432,
            last_modified: now(),
          },
        ],
    total: files.length || 1,
  };
}

export async function fetchLifecycle(): Promise<LifecycleResponse> {
  return {
    lifecycle_policies: [
      { bucket: "medai-raw-local", rules: 3, status: "ACTIVE" },
      { bucket: "medai-curated-local", rules: 2, status: "ACTIVE" },
      { bucket: "medai-audit-local", rules: 1, status: "ACTIVE" },
    ],
  };
}
