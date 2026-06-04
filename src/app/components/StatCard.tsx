import { Card } from "./ui/card";
import { cn } from "./ui/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaType = "neutral",
  className,
}: StatCardProps) {
  const deltaColors = {
    positive: "text-teal",
    negative: "text-risk",
    neutral: "text-muted-foreground",
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-l-2 border-l-teal bg-card p-6",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <p className="text-3xl font-semibold font-mono">{value}</p>
          {delta && (
            <p className={cn("text-sm mt-2 flex items-center gap-1", deltaColors[deltaType])}>
              <span>{deltaType === "positive" ? "↑" : deltaType === "negative" ? "↓" : "→"}</span>
              <span>{delta}</span>
            </p>
          )}
        </div>
        <div className="bg-primary/10 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}
