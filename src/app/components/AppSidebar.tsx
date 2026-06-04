import { Link, useLocation, useNavigate } from "react-router";
import {
  Activity,
  Archive,
  BellRing,
  ClipboardCheck,
  Database,
  FileClock,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Pill,
  Play,
  Shield,
  Terminal,
  User,
  Users,
} from "lucide-react";
import { cn } from "./ui/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useAuth, type LoginRole } from "../lib/auth";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["doctor", "analyst", "admin"],
  },
  {
    name: "Ingestion",
    href: "/ingestion",
    icon: Database,
    roles: ["analyst", "admin"],
  },
  { name: "ETL Pipeline", href: "/etl", icon: Play, roles: ["analyst", "admin"] },
  { name: "Data Quality", href: "/quality", icon: ClipboardCheck, roles: ["analyst", "admin"] },
  { name: "Monitoring", href: "/monitoring", icon: Activity, roles: ["admin"] },
  { name: "SNS Alerts", href: "/sns", icon: BellRing, roles: ["admin"] },
  { name: "IAM Access", href: "/iam", icon: Users, roles: ["admin"] },
  { name: "Audit Logs", href: "/audit", icon: FileClock, roles: ["doctor", "admin"] },
  { name: "Curated Data", href: "/curated", icon: Archive, roles: ["doctor", "analyst", "admin"] },
  { name: "Lifecycle", href: "/lifecycle", icon: Gauge, roles: ["admin"] },
  { name: "AI Triage & ABDM", href: "/abdm", icon: KeyRound, roles: ["doctor", "admin"] },
  { name: "Pharmacy & Beds", href: "/pharmacy-beds", icon: Pill, roles: ["doctor", "admin"] },
  { name: "Athena Analytics", href: "/athena", icon: Terminal, roles: ["analyst", "admin"] },
  { name: "System Logs", href: "/logs", icon: Terminal, roles: ["admin"] },
] satisfies Array<{
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: LoginRole[];
}>;

const roleLabels: Record<LoginRole, string> = {
  doctor: "Doctor",
  analyst: "Analyst",
  admin: "Admin",
};

const fallbackInitials: Record<LoginRole, string> = {
  doctor: "DS",
  analyst: "AP",
  admin: "HA",
};

const roleBadgeClasses: Record<LoginRole, string> = {
  doctor: "border-blue-200 bg-blue-50 text-blue-700",
  analyst: "border-purple-200 bg-purple-50 text-purple-700",
  admin: "border-red-200 bg-red-50 text-red-700",
};

function getInitials(username: string | undefined, role: LoginRole) {
  if (!username) {
    return fallbackInitials[role];
  }

  return username
    .split(/[-_\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const role = user?.role ?? "admin";
  const visibleNavigation = navigation.filter((item) =>
    item.roles.includes(role),
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex w-full flex-col border-r border-slate-200 bg-white md:h-screen md:w-64">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 md:px-6 md:py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-slate-950">
            MedAI Shield
          </h1>
          <p className="text-xs text-slate-500">Compliance Platform</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:overflow-visible md:py-4">
        {visibleNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 md:border-l-2 md:border-l-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-slate-200 px-6 py-4 md:block">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-600 text-white">
              {getInitials(user?.username, role) || <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-950">
              {user?.username ?? "Not signed in"}
            </p>
            <Badge
              variant="outline"
              className={cn("mt-1 text-xs", roleBadgeClasses[role])}
            >
              {roleLabels[role]}
            </Badge>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="mt-4 w-full justify-start text-slate-500 hover:text-slate-950"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
