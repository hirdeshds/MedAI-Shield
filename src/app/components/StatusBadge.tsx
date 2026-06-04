import { cn } from "./ui/utils";

type BadgeStatus = "validated" | "quarantined" | "failed" | "processing";

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

const statusConfig: Record<
  BadgeStatus,
  { label: string; className: string; icon: string }
> = {
  validated: {
    label: "Validated",
    className: "bg-teal/20 text-teal border-teal",
    icon: "✅",
  },
  quarantined: {
    label: "Quarantined",
    className: "bg-amber/20 text-amber border-amber",
    icon: "⚠️",
  },
  failed: {
    label: "Failed",
    className: "bg-risk/20 text-risk border-risk",
    icon: "❌",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-500/20 text-blue-400 border-blue-400 animate-pulse",
    icon: "⏳",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border",
        config.className,
        className
      )}
    >
      <span className="text-[10px]">{config.icon}</span>
      {config.label}
    </span>
  );
}
