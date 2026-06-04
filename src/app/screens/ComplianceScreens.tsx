import { ChangeEvent, DragEvent, ReactNode, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  Bed,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Database,
  Download,
  FileCheck2,
  FileJson,
  FileText,
  FolderCheck,
  HardDrive,
  KeyRound,
  Loader2,
  MapPinned,
  Pill,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  Stethoscope,
  Terminal,
  Upload,
  Video,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAudit,
  fetchCurated,
  fetchDashboard,
  fetchETLStatus,
  fetchIAM,
  fetchLifecycle,
  fetchMonitoring,
  fetchQuality,
  runETL,
  uploadFile,
  type AuditResponse,
  type CuratedResponse,
  type DashboardResponse,
  type EtlRunResponse,
  type EtlStatusResponse,
  type IamResponse,
  type LifecycleResponse,
  type MonitoringResponse,
  type QualityResponse,
  type UploadApiResponse,
} from "../../api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { cn } from "../components/ui/utils";

function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-white p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function LoadingState({ label = "Loading data..." }: { label?: string }) {
  return (
    <div className="flex min-h-72 items-center justify-center">
      <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
        <Loader2 className="h-5 w-5 animate-spin" />
        {label}
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </div>
  );
}

function statusClass(status: string) {
  const value = status.toUpperCase();
  if (["HEALTHY", "SUCCEEDED", "OK", "ACTIVE", "PASS"].includes(value)) {
    return "border-green-200 bg-green-50 text-green-700";
  }
  if (["RUNNING", "INSUFFICIENT_DATA", "ALREADY_RUNNING"].includes(value)) {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }
  return "border-red-200 bg-red-50 text-red-700";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value || "N/A" : date.toLocaleString();
}

function formatRelativeMinutes(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Last updated: N/A";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  return `Last updated: ${minutes} mins ago`;
}

function fileSize(size: number) {
  return `${(size / 1024).toFixed(1)} KB`;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Database;
  label: string;
  value: React.ReactNode;
  tone: "blue" | "green" | "red";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("rounded-lg p-3", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function LiveOpsHeader() {
  const [utc, setUtc] = useState(() => new Date().toUTCString().slice(17, 25));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setUtc(new Date().toUTCString().slice(17, 25));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Card className="rounded-lg border-blue-100 bg-blue-50/60 shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-green-200 bg-green-50 text-green-700" variant="outline">
            LIVE
          </Badge>
          <span className="text-sm font-medium text-slate-700">
            AegisHealth Nexus operations online
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <span>SLA: <strong className="text-green-700">99.9%</strong></span>
          <span>Region: <strong>ap-south-1</strong></span>
          <span>UTC: <strong className="font-mono text-blue-700">{utc}</strong></span>
        </div>
      </CardContent>
    </Card>
  );
}

const doctorProfiles = [
  {
    initials: "VM",
    name: "Dr. Vikram Malhotra",
    title: "Chief Interventional Cardiologist",
    tags: ["Success Rate: 97.8%", "Complex Bypass"],
    opd: "INR 1,000",
    schedule: "Mon-Fri 09:00-13:00",
    sentiment: 98,
    behavior: "Exceptionally empathetic (4.9/5)",
  },
  {
    initials: "PR",
    name: "Dr. Priya Rajan",
    title: "Senior Neurologist & Stroke Specialist",
    tags: ["Success Rate: 95.2%", "Stroke Protocol"],
    opd: "INR 1,500",
    schedule: "Tue-Sat 10:00-14:00",
    sentiment: 94,
    behavior: "Highly recommended (4.7/5)",
  },
];

function SpecialistProfiles() {
  return (
    <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold text-slate-950">
            AI-Recommended Specialist Profiles
          </CardTitle>
          <Badge className="border-green-200 bg-green-50 text-green-700" variant="outline">
            Sentiment AI
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {doctorProfiles.map((doctor) => (
          <div key={doctor.name} className="flex gap-4 rounded-lg border border-slate-100 bg-slate-50/70 p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-100 font-semibold text-blue-700">
              {doctor.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-950">{doctor.name}</p>
              <p className="text-sm text-slate-500">{doctor.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {doctor.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>OPD: {doctor.opd}</span>
                <span>{doctor.schedule}</span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">{doctor.behavior}</span>
                  <span className="font-medium text-green-700">{doctor.sentiment}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${doctor.sentiment}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EmergencyRouting() {
  const handleVideo = () => {
    toast.info("Connecting to Specialist Dr. Vikram Malhotra...");
    window.setTimeout(() => {
      toast.success(`Secure telehealth stream online. Session TH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
    }, 2200);
  };

  const handleSms = () => {
    toast.success(`Critical SMS alert dispatched. SID SM${Math.random().toString(36).slice(2, 12).toUpperCase()}`);
  };

  return (
    <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
            <MapPinned className="h-5 w-5 text-blue-600" />
            Geospatial Emergency Routing
          </CardTitle>
          <Badge className="border-red-200 bg-red-50 text-red-700" variant="outline">
            Live Track
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
          <svg width="100%" height="220" viewBox="0 0 500 220" role="img" aria-label="Emergency route map">
            <defs>
              <pattern id="medai-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e3a5f" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="500" height="220" fill="url(#medai-grid)" />
            <line x1="0" y1="110" x2="500" y2="110" stroke="#1e3a5f" strokeWidth="2" />
            <line x1="250" y1="0" x2="250" y2="220" stroke="#1e3a5f" strokeWidth="2" />
            <path d="M 80 160 Q 180 80 320 100 T 430 60" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="8 4" />
            <circle cx="80" cy="160" r="10" fill="#ef4444" />
            <text x="80" y="185" fill="#ef4444" fontSize="10" textAnchor="middle">Patient</text>
            <rect x="305" y="85" width="30" height="30" rx="4" fill="#38bdf8" />
            <text x="320" y="105" fill="#0f172a" fontSize="12" textAnchor="middle" fontWeight="bold">H</text>
            <text x="320" y="130" fill="#38bdf8" fontSize="10" textAnchor="middle">Hospital</text>
            <polygon points="430,50 445,65 415,65" fill="#f59e0b" />
            <text x="430" y="82" fill="#f59e0b" fontSize="10" textAnchor="middle">Ambulance</text>
            <rect x="180" y="60" width="90" height="22" rx="4" fill="#0f172a" stroke="#38bdf8" />
            <text x="225" y="75" fill="#38bdf8" fontSize="10" textAnchor="middle">ETA: 4 min</text>
          </svg>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleVideo}>
            <Video className="h-4 w-4" />
            Initiate Telehealth Video
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleSms}>
            <Send className="h-4 w-4" />
            Broadcast Critical SMS Alert
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const pharmacyItems = [
  { name: "Aspirin 325mg", qty: "240 tabs", status: "IN STOCK", tone: "green" },
  { name: "Thrombolytics (tPA)", qty: "4 vials", status: "LOW STOCK", tone: "yellow" },
  { name: "Epinephrine 1mg/mL", qty: "18 amps", status: "IN STOCK", tone: "green" },
  { name: "Heparin 5000 IU", qty: "32 vials", status: "IN STOCK", tone: "green" },
  { name: "Morphine Sulfate 10mg", qty: "0 units", status: "OUT OF STOCK", tone: "red" },
  { name: "Atropine 0.5mg", qty: "12 amps", status: "IN STOCK", tone: "green" },
  { name: "Amiodarone 150mg", qty: "8 vials", status: "IN STOCK", tone: "green" },
  { name: "Metoprolol 50mg", qty: "3 strips", status: "LOW STOCK", tone: "yellow" },
];

function toneBadge(tone: string) {
  if (tone === "green") return "border-green-200 bg-green-50 text-green-700";
  if (tone === "yellow") return "border-yellow-200 bg-yellow-50 text-yellow-700";
  return "border-red-200 bg-red-50 text-red-700";
}

function InsuranceAndPharmacy() {
  const [total, setTotal] = useState(12000);
  const [coverage, setCoverage] = useState(0.9);

  const recalculate = () => {
    const totals = [8500, 12000, 15500, 22000, 9800, 18000];
    const coverages = [0.8, 0.85, 0.9, 0.95];
    const nextTotal = totals[Math.floor(Math.random() * totals.length)];
    const nextCoverage = coverages[Math.floor(Math.random() * coverages.length)];
    setTotal(nextTotal);
    setCoverage(nextCoverage);
    toast.success(`Claim recalculated. Patient payable INR ${Math.round(nextTotal * (1 - nextCoverage)).toLocaleString("en-IN")}`);
  };

  return (
    <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
            <CreditCard className="h-5 w-5 text-green-600" />
            Insurance Claim Estimator
          </CardTitle>
          <Badge className="border-green-200 bg-green-50 text-green-700" variant="outline">
            Auto-Calc
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
          <div className="flex justify-between gap-3"><span className="text-slate-500">Provider</span><span className="font-medium text-slate-900">Star Health Insurance</span></div>
          <div className="flex justify-between gap-3"><span className="text-slate-500">Coverage</span><span className="font-medium text-green-700">{Math.round(coverage * 100)}% Costs Covered</span></div>
          <div className="flex justify-between gap-3"><span className="text-slate-500">Total Estimate</span><span className="font-medium text-slate-900">INR {total.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between gap-3 rounded-md bg-white p-3"><span className="text-slate-500">Patient Payable</span><span className="font-semibold text-blue-700">INR {Math.round(total * (1 - coverage)).toLocaleString("en-IN")}</span></div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={recalculate}>
            <RefreshCw className="h-4 w-4" />
            Recalculate Claim
          </Button>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-950">Emergency Pharmacy Stock</h3>
            <Badge className="border-yellow-200 bg-yellow-50 text-yellow-700" variant="outline">
              Live Inventory
            </Badge>
          </div>
          <div className="space-y-2">
            {pharmacyItems.slice(0, 6).map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
                <span className="text-sm font-medium text-slate-800">{item.name}</span>
                <Badge className={toneBadge(item.tone)} variant="outline">{item.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineSimulator({ active }: { active: boolean }) {
  const [progress, setProgress] = useState([0, 0, 0]);

  useEffect(() => {
    if (!active) return;
    setProgress([0, 0, 0]);
    const timers = [
      window.setTimeout(() => setProgress([100, 0, 0]), 800),
      window.setTimeout(() => setProgress([100, 100, 0]), 1800),
      window.setTimeout(() => setProgress([100, 100, 100]), 2900),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [active]);

  if (!active) return null;

  const steps = [
    "S3 Event Trigger -> Activating Lambda Function",
    "Evaluating Data Quality via AWS Glue Engine",
    "SHA-256 Column Masking & Quarantine Routing",
  ];

  return (
    <Card className="rounded-lg border-blue-100 bg-blue-50/50 shadow-sm">
      <CardContent className="space-y-4 p-5">
        {steps.map((step, index) => (
          <div key={step} className="grid grid-cols-[1rem_1fr_3rem] items-center gap-3">
            <span className={cn("h-3 w-3 rounded-full", progress[index] === 100 ? "bg-green-500" : "bg-blue-500 animate-pulse")} />
            <div>
              <div className="text-sm font-medium text-slate-800">{step}</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-700" style={{ width: `${progress[index]}%` }} />
              </div>
            </div>
            <span className="text-right text-sm font-mono text-slate-600">{progress[index]}%</span>
          </div>
        ))}
        {progress.every((value) => value === 100) ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
            Status: 4 columns masked with SHA-256. Quarantine routing verified.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AbdmgatewayScreen() {
  const [token, setToken] = useState("");
  const [stepsVisible, setStepsVisible] = useState(false);

  const generateToken = () => {
    const rand = (n: number) => Array.from({ length: n }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("");
    const nextToken = `TOKEN-${rand(4)}-${rand(2)}`;
    setToken(nextToken);
    setStepsVisible(false);
    window.setTimeout(() => setStepsVisible(true), 100);
    toast.success(`ABDM Token Generated: ${nextToken}`);
  };

  return (
    <PageShell title="AI Triage & ABDM" subtitle="ABHA identity, government schemes, and clinical prioritization">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-5 w-5 text-blue-600" />
                ABHA Identity Gateway
              </CardTitle>
              <Badge className="border-green-200 bg-green-50 text-green-700" variant="outline">Verified</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
              <p className="font-semibold text-blue-900">ABHA</p>
              <p className="mt-3 text-xl font-semibold text-slate-950">Rajesh Kumar Sharma</p>
              <p className="text-sm text-slate-600">ABHA ID: 91-1234-5678-9012</p>
              <p className="mt-3 text-sm font-medium text-green-700">ABHA card verified via National Health Gateway</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">DOB</span><p className="font-medium">14 Mar 1978</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Gender</span><p className="font-medium">Male</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">State</span><p className="font-medium">Maharashtra</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Linked Records</span><p className="font-medium text-blue-700">7 Health Records</p></div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={generateToken}>
              <KeyRound className="h-4 w-4" />
              Generate ABDM Token
            </Button>
            {token ? (
              <div className="rounded-lg border border-blue-100 bg-slate-50 p-4">
                <p className="font-mono text-lg font-semibold text-blue-700">{token}</p>
                {stepsVisible ? (
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <p>Step 1: ABHA connected via ABDM sandbox portal</p>
                    <p>Step 2: Token verified at electronic queue gateway</p>
                    <p>Step 3: Fast-track OPD slip generated</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Stethoscope className="h-5 w-5 text-red-600" />Clinical AI Triage Engine</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-green-100 bg-green-50 p-4">
              <div className="flex justify-between"><span className="font-semibold">Ayushman Bharat (PM-JAY)</span><Badge className="bg-green-100 text-green-700">Active</Badge></div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <span>Annual Cover: <strong>INR 5,00,000</strong></span>
                <span>Utilized: <strong>INR 42,300</strong></span>
                <span className="col-span-2">Coverage Balance: <strong className="text-green-700">INR 4,57,700 wallet active</strong></span>
              </div>
            </div>
            <div className="space-y-2">
              {[
                ["Arjun Mehta, 58M", "Acute MI - STEMI", "CRITICAL", "2 min", "red"],
                ["Sunita Devi, 44F", "Hypertensive Crisis", "MODERATE", "8 min", "yellow"],
                ["Ravi Shankar, 32M", "Laceration - Forearm", "ROUTINE", "22 min", "green"],
                ["Meena Pillai, 67F", "Ischemic Stroke", "CRITICAL", "1 min", "red"],
                ["Deepak Nair, 51M", "Diabetic Ketoacidosis", "MODERATE", "11 min", "yellow"],
              ].map(([patient, condition, alert, wait, tone]) => (
                <div key={patient} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 p-3 text-sm md:grid-cols-[1fr_1.2fr_auto_auto] md:items-center">
                  <span className="font-medium text-slate-900">{patient}</span>
                  <span className="text-slate-600">{condition}</span>
                  <Badge className={toneBadge(tone)} variant="outline">{alert}</Badge>
                  <span className="font-mono text-slate-500">{wait}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
              AI runway calculator: max safe wait window 12 minutes. Stroke protocol active.
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

const initialBeds = [
  ["ICU-01", "occupied"], ["ICU-02", "occupied"], ["ICU-03", "available"], ["ICU-04", "available"],
  ["ICU-05", "available"], ["ICU-06", "occupied"], ["VENT-1", "available"], ["VENT-2", "occupied"],
  ["VENT-3", "occupied"], ["CCU-01", "reserved"], ["CCU-02", "occupied"], ["CCU-03", "available"],
  ["GW-01", "available"], ["GW-02", "available"], ["GW-03", "available"], ["GW-04", "occupied"],
  ["GW-05", "available"], ["GW-06", "available"], ["GW-07", "reserved"], ["GW-08", "available"],
  ["GW-09", "available"], ["GW-10", "occupied"], ["GW-11", "available"], ["GW-12", "available"],
  ["GW-13", "available"], ["GW-14", "available"], ["GW-15", "available"], ["GW-16", "reserved"],
].map(([label, state]) => ({ label, state }));

function bedClass(state: string) {
  if (state === "available") return "border-green-200 bg-green-50 text-green-700";
  if (state === "reserved") return "border-yellow-200 bg-yellow-50 text-yellow-700";
  return "border-red-200 bg-red-50 text-red-700";
}

export function PharmacyBedsScreen() {
  const [beds, setBeds] = useState(initialBeds);

  const cycleBed = (label: string) => {
    const states = ["available", "occupied", "reserved"];
    setBeds((current) =>
      current.map((bedItem) => {
        if (bedItem.label !== label) return bedItem;
        const next = states[(states.indexOf(bedItem.state) + 1) % states.length];
        toast.info(`${label}: ${bedItem.state.toUpperCase()} -> ${next.toUpperCase()}`);
        return { ...bedItem, state: next };
      }),
    );
  };

  const count = (state: string) => beds.filter((bedItem) => bedItem.state === state).length;

  return (
    <PageShell title="Live Pharmacy & Beds" subtitle="Bed tracking matrix and emergency pharmacy inventory">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard icon={Bed} label="ICU Beds Available" value={beds.filter((bedItem) => bedItem.label.startsWith("ICU") && bedItem.state === "available").length} tone="green" />
        <MetricCard icon={Activity} label="Ventilators Available" value={beds.filter((bedItem) => bedItem.label.startsWith("VENT") && bedItem.state === "available").length} tone="blue" />
        <MetricCard icon={Building2} label="General Ward Beds" value={beds.filter((bedItem) => bedItem.label.startsWith("GW") && bedItem.state === "available").length} tone="green" />
        <MetricCard icon={Pill} label="Drug SKUs Tracked" value={pharmacyItems.length} tone="blue" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold text-slate-950">Live Bed Tracking Matrix</CardTitle>
              <div className="flex gap-2 text-xs text-slate-500">
                <span>{count("available")} available</span>
                <span>{count("occupied")} occupied</span>
                <span>{count("reserved")} reserved</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {beds.map((bedItem) => (
                <button
                  key={bedItem.label}
                  className={cn("rounded-lg border p-3 text-left transition hover:shadow-sm", bedClass(bedItem.state))}
                  onClick={() => cycleBed(bedItem.label)}
                  type="button"
                >
                  <span className="block font-semibold">{bedItem.label}</span>
                  <span className="text-xs uppercase">{bedItem.state}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardHeader><CardTitle className="text-base font-semibold text-slate-950">Full Pharmacy Inventory</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pharmacyItems.map((item) => (
              <div key={item.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-slate-100 p-3 text-sm">
                <span className="font-medium text-slate-900">{item.name}</span>
                <span className="text-slate-500">{item.qty}</span>
                <Badge className={toneBadge(item.tone)} variant="outline">{item.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

const sqlPresets: Record<string, string> = {
  patient_stats: `SELECT disease_code,
       COUNT(*) AS total_patients,
       SUM(insurance_claim_est) AS total_claims
FROM   hc_compliance_db.patient_analytics_gold
GROUP  BY disease_code
ORDER  BY total_patients DESC;`,
  hashed_records: `SELECT patient_id,
       patient_name AS masked_sha256_name,
       phone_number AS masked_sha256_phone,
       disease_code, severity_level, recommended_specialist
FROM   hc_compliance_db.patient_analytics_gold
ORDER  BY patient_id DESC
LIMIT  50;`,
  insurance_claims: `SELECT recommended_specialist,
       COUNT(*) AS case_load,
       SUM(insurance_claim_est) AS projected_coverage
FROM   hc_compliance_db.patient_analytics_gold
GROUP  BY recommended_specialist;`,
  bed_utilization: `SELECT severity_level,
       COUNT(*) AS recorded_incidents
FROM   hc_compliance_db.patient_analytics_gold
GROUP  BY severity_level;`,
};

function queryRows(type: string) {
  if (type === "patient_stats") {
    return {
      headers: ["disease_code", "total_patients", "total_claims"],
      rows: [["I21.0", "186", "INR 4,62,000"], ["J18.9", "93", "INR 2,19,500"], ["E11.9", "141", "INR 3,38,400"]],
    };
  }
  if (type === "insurance_claims") {
    return {
      headers: ["recommended_specialist", "case_load", "projected_coverage"],
      rows: [["Dr. Vikram", "42", "INR 18,40,000"], ["Dr. Priya", "34", "INR 14,72,000"], ["Dr. Rahul", "27", "INR 9,88,000"]],
    };
  }
  if (type === "bed_utilization") {
    return {
      headers: ["severity_level", "recorded_incidents"],
      rows: [["CRITICAL", "44"], ["MODERATE", "118"], ["ROUTINE", "286"]],
    };
  }
  return {
    headers: ["patient_id", "masked_sha256_name", "masked_sha256_phone", "disease_code", "severity_level"],
    rows: [
      ["PID-14020", "sha256_a94f16cc...", "sha256_d83b11ae...", "I21.0", "CRITICAL"],
      ["PID-14021", "sha256_c91e047a...", "sha256_aae9012d...", "J18.9", "MODERATE"],
      ["PID-14022", "sha256_3bca9921...", "sha256_7cf11290...", "E11.9", "ROUTINE"],
      ["PID-14023", "sha256_bb178a42...", "sha256_f0d239aa...", "I63.9", "CRITICAL"],
    ],
  };
}

const auditMessages = [
  "IAM role Doctor_Access authorized analytical database views",
  "S3 PutObject curated-records/batch_001.parquet - KMS AES-256 verified",
  "Lambda data validator cold execution baseline 280ms",
  "AWS Lake Formation permissions verified for analyst_role",
  "CloudWatch SLA alarm check: processing queue latency <= 15s",
  "KMS cryptokey rotation cycle completed",
];

export function AthenaScreen() {
  const [preset, setPreset] = useState("hashed_records");
  const [query, setQuery] = useState(sqlPresets.hashed_records);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(queryRows("hashed_records"));
  const [queryMeta, setQueryMeta] = useState("Ready");
  const [auditStream, setAuditStream] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAuditStream((current) => [`[${new Date().toLocaleTimeString()}] ${auditMessages[current.length % auditMessages.length]}`, ...current].slice(0, 12));
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  const runQuery = () => {
    setRunning(true);
    setQueryMeta("Executing serverless Athena engine...");
    const started = Date.now();
    window.setTimeout(() => {
      setResult(queryRows(preset));
      setRunning(false);
      setQueryMeta(`Execution time: ${((Date.now() - started) / 1000).toFixed(2)}s | Scanned: ${(Math.random() * 85 + 15).toFixed(1)} MB | Layout: Parquet`);
      toast.success("Athena scanning complete");
    }, Math.floor(Math.random() * 700) + 600);
  };

  return (
    <PageShell title="Athena Analytics" subtitle="SQL query terminal and CloudTrail audit stream">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Terminal className="h-5 w-5 text-blue-600" />
                Athena SQL Query Terminal
              </CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={preset}
                  onChange={(event) => {
                    setPreset(event.target.value);
                    setQuery(sqlPresets[event.target.value]);
                  }}
                >
                  <option value="patient_stats">Fetch Patient Statistics</option>
                  <option value="hashed_records">Show Hashed Security Records</option>
                  <option value="insurance_claims">Insurance Claims Summary</option>
                  <option value="bed_utilization">Bed Utilization Report</option>
                </select>
                <Button className="bg-blue-600 hover:bg-blue-700" disabled={running} onClick={runQuery}>
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Run Query
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="min-h-48 w-full rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-xs text-blue-100"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              spellCheck={false}
            />
            <p className="text-sm text-slate-500">{queryMeta}</p>
            <Table>
              <TableHeader>
                <TableRow>{result.headers.map((header) => <TableHead key={header}>{header}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((row) => (
                  <TableRow key={row.join("-")}>{row.map((cell) => <TableCell key={cell} className="font-mono text-xs">{cell}</TableCell>)}</TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">CloudTrail Audit Stream</CardTitle>
              <Badge className="border-red-200 bg-red-50 text-red-700" variant="outline">Live Feed</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[28rem] space-y-2 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-200">
              {auditStream.map((entry) => <div key={entry} className="font-mono">{entry}</div>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

const autoLogMessages = [
  ["S3_GATEWAY", "Secure chunk object upload complete. Integrity checksum verified."],
  ["LAMBDA_FN", "Data validator invoked: payload unpacked and validation checks matching."],
  ["AWS_GLUE", "Serverless transformation workers allocated."],
  ["COMPLIANCE", "SHA-256 patient credential anonymization complete."],
  ["IAM_SVC", "Role token mapping evaluated successfully."],
  ["CLOUDWATCH", "Pipeline SLA metric within bounds."],
  ["KMS", "Analytics-gold encryption schema handshake resolved."],
];

export function SystemLogsScreen() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLogs((current) => {
        const [service, message] = autoLogMessages[current.length % autoLogMessages.length];
        return [...current, `[${new Date().toLocaleTimeString()}] [${service}] ${message}`].slice(-120);
      });
    }, 3500);
    return () => window.clearInterval(timer);
  }, []);

  const clearLogs = () => {
    setLogs([]);
    toast.info("Logs buffer flushed");
  };

  const exportLogs = () => {
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `medai-cloudwatch-logs-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`${logs.length} logs exported`);
  };

  return (
    <PageShell title="System Logs" subtitle="CloudWatch-style event aggregator">
      <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-blue-600" />
              System Event Logs
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearLogs}>Clear</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={exportLogs}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[32rem] overflow-auto rounded-lg bg-slate-950 p-4 font-mono text-xs text-blue-100">
            {logs.length ? logs.map((log) => <div key={log} className="py-1">{log}</div>) : <p className="text-slate-400">Waiting for system events...</p>}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

export function DashboardScreen() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchDashboard()
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PageShell title="Dashboard" subtitle="Healthcare compliance and analytics overview">
      <LiveOpsHeader />
      {loading ? <LoadingState label="Loading dashboard..." /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {data ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard icon={HardDrive} label="Total Raw Files" value={data.total_raw_files} tone="blue" />
            <MetricCard icon={FolderCheck} label="Curated Files" value={data.total_curated_files} tone="green" />
            <MetricCard icon={FileCheck2} label="Valid Records" value={data.valid_records} tone="green" />
            <MetricCard icon={AlertTriangle} label="Quarantined Records" value={data.quarantined_records} tone="red" />
            <MetricCard
              icon={Activity}
              label="Pipeline Status"
              value={<Badge className={statusClass(data.pipeline_status)} variant="outline">{data.pipeline_status}</Badge>}
              tone={data.pipeline_status.toUpperCase() === "HEALTHY" ? "green" : "red"}
            />
            <MetricCard
              icon={ShieldCheck}
              label="Compliance Score"
              value={`${Number(data.compliance_score).toFixed(1)}%`}
              tone="green"
            />
          </div>
          <p className="text-sm text-slate-500">{formatRelativeMinutes(data.last_updated)}</p>
        </>
      ) : null}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SpecialistProfiles />
        <EmergencyRouting />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <InsuranceAndPharmacy />
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Government Scheme Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-green-100 bg-green-50 p-4">
              <div className="flex justify-between gap-3">
                <span className="font-semibold text-slate-950">Ayushman Bharat (PM-JAY)</span>
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              </div>
              <p className="mt-2 text-slate-600">Coverage balance: <strong className="text-green-700">INR 4,57,700 wallet active</strong></p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="flex justify-between gap-3">
                <span className="font-semibold text-slate-950">CGHS</span>
                <Badge className="bg-blue-100 text-blue-700">Enrolled</Badge>
              </div>
              <p className="mt-2 text-slate-600">Empanelled hospitals: <strong className="text-blue-700">142 hospitals</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

export function IngestionScreen() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadApiResponse | null>(null);
  const [error, setError] = useState("");
  const [pipelineActive, setPipelineActive] = useState(false);

  const selectFile = (nextFile?: File) => {
    if (!nextFile) return;
    if (!nextFile.name.toLowerCase().match(/\.(csv|json)$/)) {
      setError("Only .csv and .json files are accepted.");
      toast.error("Only .csv and .json files are accepted");
      return;
    }
    setFile(nextFile);
    setResult(null);
    setError("");
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      setPipelineActive(true);
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Could not read file."));
        reader.readAsText(file);
      });
      const type = file.name.toLowerCase().endsWith(".csv") ? "csv" : "json";
      const response = await uploadFile(text, type);
      setResult(response);
      toast.success("File processed successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageShell title="Data Ingestion" subtitle="Upload CSV or JSON records for secure processing">
      {error ? <ErrorBanner message={error} /> : null}
      <Card
        className={cn(
          "rounded-lg border-2 border-dashed bg-white shadow-sm transition-colors",
          dragging ? "border-blue-500 bg-blue-50" : "border-blue-200",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <Upload className="h-10 w-10 text-blue-600" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">Drop file here</h2>
          <p className="mt-1 text-sm text-slate-500">Accepts .csv and .json only</p>
          <Button className="mt-5 bg-blue-600 hover:bg-blue-700" onClick={() => inputRef.current?.click()}>
            Browse files
          </Button>
          <input ref={inputRef} className="hidden" type="file" accept=".csv,.json" onChange={handleChange} />
        </CardContent>
      </Card>

      {file ? (
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {file.name.endsWith(".json") ? <FileJson className="h-5 w-5 text-blue-600" /> : <FileText className="h-5 w-5 text-blue-600" />}
              <div>
                <p className="font-medium text-slate-950">{file.name}</p>
                <p className="text-sm text-slate-500">{fileSize(file.size)}</p>
              </div>
            </div>
            <Button disabled={uploading} onClick={handleUpload} className="bg-green-600 hover:bg-green-700">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <PipelineSimulator active={pipelineActive} />

      {result ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard icon={Database} label="Total Records" value={result.total_records} tone="blue" />
          <MetricCard icon={CheckCircle2} label="Valid Records" value={result.valid_records} tone="green" />
          <MetricCard icon={XCircle} label="Invalid Records" value={result.invalid_records} tone="red" />
          <p className="md:col-span-3 text-sm text-slate-500">Timestamp: {formatDate(result.timestamp)}</p>
        </div>
      ) : null}
    </PageShell>
  );
}

export function EtlScreen() {
  const [data, setData] = useState<EtlStatusResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStatus = async () => {
    const payload = await fetchETLStatus();
    setData(payload);
  };

  useEffect(() => {
    let mounted = true;
    loadStatus()
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load ETL status.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const hasRunningJob = data?.job_runs.some((job) => job.status.toUpperCase() === "RUNNING") ?? false;

  const handleRun = async () => {
    setRunning(true);
    setError("");
    try {
      const response: EtlRunResponse = await runETL();
      if (response.status === "ALREADY_RUNNING") {
        toast.warning("ETL job is already running");
      } else {
        toast.success("Job Started!");
      }
      window.setTimeout(() => void loadStatus().catch(() => undefined), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start ETL job.";
      setError(message);
      toast.error(message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <PageShell title="ETL Pipeline" subtitle="Glue job status and controlled pipeline execution">
      {loading ? <LoadingState label="Loading ETL jobs..." /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      <div className="flex justify-end">
        <Button onClick={handleRun} disabled={running || hasRunningJob} className="bg-blue-600 hover:bg-blue-700">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run ETL Job
        </Button>
      </div>
      {data ? (
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.job_runs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono">{job.id.slice(0, 20)}...</TableCell>
                    <TableCell><Badge variant="outline" className={statusClass(job.status)}>{job.status}</Badge></TableCell>
                    <TableCell>{formatDate(job.started)}</TableCell>
                    <TableCell>{job.duration}s</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </PageShell>
  );
}

export function QualityScreen() {
  const [data, setData] = useState<QualityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchQuality()
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load quality data.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const score = data?.quality_score ?? 0;
  const passed = score > 80;

  return (
    <PageShell title="Data Quality" subtitle="Validation score and quarantine threshold">
      {loading ? <LoadingState label="Loading quality check..." /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {data ? (
        <>
          <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardContent className="flex flex-col items-center gap-5 p-8">
              <div
                className="grid h-48 w-48 place-items-center rounded-full"
                style={{ background: `conic-gradient(#16a34a ${score * 3.6}deg, #e2e8f0 0deg)` }}
              >
                <div className="grid h-36 w-36 place-items-center rounded-full bg-white">
                  <div className="text-center">
                    <p className="text-4xl font-semibold text-slate-950">{score}%</p>
                    <Badge variant="outline" className={passed ? statusClass("PASS") : statusClass("FAIL")}>
                      {passed ? "PASS" : "FAIL"}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-500">Threshold: 80% - records below threshold go to quarantine</p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <MetricCard icon={CheckCircle2} label="Valid Files" value={data.valid_files} tone="green" />
            <MetricCard icon={XCircle} label="Quarantined Files" value={data.quarantined_files} tone="red" />
          </div>
        </>
      ) : null}
    </PageShell>
  );
}

export function MonitoringScreen() {
  const [data, setData] = useState<MonitoringResponse | null>(null);
  const [refreshedAt, setRefreshedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    const payload = await fetchMonitoring();
    setData(payload);
    setRefreshedAt(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    let mounted = true;
    load()
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load alarms.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    const interval = window.setInterval(() => void load().catch(() => undefined), 30000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <PageShell title="Monitoring" subtitle="CloudWatch alarms and service health">
      {loading ? <LoadingState label="Loading alarms..." /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {data ? (
        <>
          <div className="flex flex-col justify-between gap-2 sm:flex-row">
            <p className="font-medium text-slate-950">Total alarms: {data.alarms.length}</p>
            <p className="text-sm text-slate-500">Last refreshed: {refreshedAt}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {data.alarms.map((alarm) => (
              <Card key={alarm.name} className="rounded-lg border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base font-semibold text-slate-950">{alarm.name}</CardTitle>
                    <Badge variant="outline" className={statusClass(alarm.state)}>{alarm.state}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-slate-500">{alarm.metric}</p>
                  <p className="text-sm text-slate-700">{alarm.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </PageShell>
  );
}

function roleFor(username: string) {
  const value = username.toLowerCase();
  if (value.startsWith("dr-")) return { label: "Doctor", className: "border-blue-200 bg-blue-50 text-blue-700" };
  if (value.startsWith("analyst-")) return { label: "Analyst", className: "border-purple-200 bg-purple-50 text-purple-700" };
  if (value.includes("admin")) return { label: "Admin", className: "border-red-200 bg-red-50 text-red-700" };
  return { label: "User", className: "border-slate-200 bg-slate-50 text-slate-700" };
}

export function IamScreen() {
  const [data, setData] = useState<IamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchIAM()
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load users.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PageShell title="IAM Access Control" subtitle="User identities and attached policies">
      {loading ? <LoadingState label="Loading IAM users..." /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {data ? (
        <>
          <p className="font-medium text-slate-950">Total users: {data.users.length}</p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {data.users.map((user) => {
              const role = roleFor(user.username);
              return (
                <Card key={user.username} className="rounded-lg border-slate-200 bg-white shadow-sm">
                  <CardContent className="flex gap-4 p-5">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-100 font-semibold text-blue-700">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">{user.username}</p>
                        <Badge variant="outline" className={role.className}>{role.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">Created: {formatDate(user.created)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {user.policies.map((policy) => (
                          <Badge key={policy} variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                            {policy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : null}
    </PageShell>
  );
}

function sourceClass(source: string) {
  const value = source.toLowerCase();
  if (value.includes("s3")) return "bg-blue-500";
  if (value.includes("lambda")) return "bg-orange-500";
  if (value.includes("iam")) return "bg-red-500";
  if (value.includes("glue")) return "bg-purple-500";
  if (value.includes("cloudtrail")) return "bg-green-500";
  return "bg-slate-400";
}

export function AuditScreen() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchAudit()
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load audit events.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const events = data?.events.slice(0, 20) ?? [];

  return (
    <PageShell title="Audit Logs" subtitle="20 most recent events">
      {loading ? <LoadingState label="Loading audit timeline..." /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {data ? (
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardHeader><CardTitle>20 most recent events</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-0">
              {events.map((event, index) => (
                <div key={`${event.time}-${event.name}-${index}`} className="grid grid-cols-[8rem_1rem_1fr] gap-4">
                  <div className="py-4 text-right text-xs text-slate-500">{formatDate(event.time)}</div>
                  <div className="relative flex justify-center">
                    <span className={cn("mt-5 h-3 w-3 rounded-full", sourceClass(event.source))} />
                    {index < events.length - 1 ? <span className="absolute top-8 h-full w-px bg-slate-200" /> : null}
                  </div>
                  <div className="py-4">
                    <p className="font-semibold text-slate-950">{event.name}</p>
                    <p className="text-sm text-slate-500">{event.user} - {event.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageShell>
  );
}

function partitionPath(key: string) {
  const parts = key.split("/").filter((part) => /(year|month|day)=/.test(part));
  return parts.length ? parts.join("/") : key;
}

export function CuratedScreen() {
  const [data, setData] = useState<CuratedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchCurated()
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load curated records.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PageShell title="Curated Data" subtitle="Validated PHI records in curated storage">
      {loading ? <LoadingState label="Loading curated files..." /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {data ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-medium text-slate-950">Total files: {data.total}</p>
            <Badge className="bg-green-50 text-green-700" variant="outline">HIPAA Compliant</Badge>
            <Badge className="bg-red-50 text-red-700" variant="outline">PHI Data</Badge>
          </div>
          <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Last Modified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.files.map((file) => (
                    <TableRow key={file.key}>
                      <TableCell className="font-mono text-xs">{partitionPath(file.key)}</TableCell>
                      <TableCell>{fileSize(file.size)}</TableCell>
                      <TableCell>{formatDate(file.last_modified)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </PageShell>
  );
}

export function LifecycleScreen() {
  const [data, setData] = useState<LifecycleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchLifecycle()
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load lifecycle status.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const optimized = data?.lifecycle_policies.every((policy) => policy.status === "ACTIVE") ?? false;

  return (
    <PageShell title="Lifecycle & Cost" subtitle="Retention rules and storage cost controls">
      {loading ? <LoadingState label="Loading lifecycle policies..." /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {data ? (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {data.lifecycle_policies.map((policy) => (
              <Card key={policy.bucket} className="rounded-lg border-slate-200 bg-white shadow-sm">
                <CardContent className="space-y-3 p-5">
                  <Archive className="h-5 w-5 text-blue-600" />
                  <p className="truncate font-semibold text-slate-950">{policy.bucket}</p>
                  <p className="text-sm text-slate-500">{policy.rules} lifecycle rules</p>
                  <Badge variant="outline" className={statusClass(policy.status)}>{policy.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <CircleDollarSign className="h-5 w-5 text-green-600" />
                  Cost Summary
                </CardTitle>
                {optimized ? <Badge className="bg-green-50 text-green-700" variant="outline">Cost Optimized</Badge> : null}
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">30 days {">"} Standard IA (cheaper)</div>
              <div className="rounded-lg bg-slate-50 p-4">90 days {">"} Glacier (archive)</div>
              <div className="rounded-lg bg-slate-50 p-4">7 years {">"} Auto delete</div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </PageShell>
  );
}
