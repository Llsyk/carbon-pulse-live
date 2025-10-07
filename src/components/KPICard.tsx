import { ArrowUp, ArrowDown, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface KPICardProps {
  id: string;
  title: string;
  value: number;
  unit?: string;
  trend?: "up" | "down";
  variant?: "default" | "success" | "warning" | "destructive";
  hint?: string;
}

const KPICard = ({
  id,
  title,
  value,
  unit = "MTCO₂e",
  trend,
  variant = "default",
  hint,
}: KPICardProps) => {
  const formattedValue = new Intl.NumberFormat("en-US").format(value);

  const variantStyles = {
    default: "bg-gradient-to-br from-card to-card",
    success: "bg-gradient-to-br from-success/10 to-success/5 border-success/20",
    warning: "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20",
    destructive: "bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20",
  };

  const trendColors = { up: "text-destructive", down: "text-success" };

  return (
    <Card
      id={id}
      className={`${variantStyles[variant]} shadow-card hover:shadow-elevated transition-shadow`}
      role="group"
      aria-label={title}
    >
      <CardHeader className="pb-2 flex items-start justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {hint && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                className="text-muted-foreground/70 hover:text-foreground"
                aria-label="More info"
              >
                <Info className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>{hint}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground">{formattedValue}</p>
            <p className="text-xs text-muted-foreground mt-1">{unit}</p>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 ${trendColors[trend]}`} aria-label={`Trend ${trend}`}>
              {trend === "up" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;
