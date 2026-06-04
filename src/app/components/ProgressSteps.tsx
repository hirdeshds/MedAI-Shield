import { cn } from "./ui/utils";

type StepStatus = "pending" | "active" | "completed";

interface Step {
  label: string;
  status: StepStatus;
}

interface ProgressStepsProps {
  steps: Step[];
  className?: string;
}

export function ProgressSteps({ steps, className }: ProgressStepsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          <div className="flex items-center gap-3 flex-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                step.status === "completed" && "bg-teal text-teal-foreground",
                step.status === "active" && "bg-primary text-primary-foreground animate-pulse",
                step.status === "pending" && "bg-muted text-muted-foreground"
              )}
            >
              {step.status === "completed" ? "✓" : index + 1}
            </div>
            <div className="flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.status === "active" && "text-foreground",
                  step.status === "completed" && "text-teal",
                  step.status === "pending" && "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className="w-16 h-0.5 mx-2 bg-muted">
              <div
                className={cn(
                  "h-full transition-all",
                  step.status === "completed" && "bg-teal w-full"
                )}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
