import { cn } from "./ui/utils";

interface RiskScorePillProps {
  score: number;
  className?: string;
}

export function RiskScorePill({ score, className }: RiskScorePillProps) {
  const getRiskLevel = (score: number) => {
    if (score < 40) return { label: "Low", className: "bg-teal/20 text-teal border-teal" };
    if (score < 70) return { label: "Medium", className: "bg-amber/20 text-amber border-amber" };
    return { label: "High", className: "bg-risk/20 text-risk border-risk" };
  };

  const risk = getRiskLevel(score);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border",
        risk.className,
        className
      )}
    >
      <span className="font-mono">{score}%</span>
      <span>{risk.label}</span>
    </span>
  );
}
