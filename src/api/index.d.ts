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

export const fetchDashboard: () => Promise<DashboardResponse>;
export const uploadFile: (
  fileText: string,
  fileType: "csv" | "json",
) => Promise<UploadApiResponse>;
export const fetchETLStatus: () => Promise<EtlStatusResponse>;
export const runETL: () => Promise<EtlRunResponse>;
export const fetchQuality: () => Promise<QualityResponse>;
export const fetchMonitoring: () => Promise<MonitoringResponse>;
export const fetchIAM: () => Promise<IamResponse>;
export const fetchAudit: () => Promise<AuditResponse>;
export const fetchCurated: () => Promise<CuratedResponse>;
export const fetchLifecycle: () => Promise<LifecycleResponse>;
