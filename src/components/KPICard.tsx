import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KPICardProps {
  id: string;
  title: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down';
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const KPICard = ({ id, title, value, unit = 'MTCO₂e', trend, variant = 'default' }: KPICardProps) => {
  const formattedValue = new Intl.NumberFormat('en-US').format(value);
  
  const variantStyles = {
    default: 'bg-gradient-to-br from-card to-card',
    success: 'bg-gradient-to-br from-success/10 to-success/5 border-success/20',
    warning: 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20',
    destructive: 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20',
  };

  const trendColors = {
    up: 'text-destructive',
    down: 'text-success',
  };

  return (
    <Card id={id} className={`${variantStyles[variant]} shadow-card hover:shadow-elevated transition-shadow`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground">{formattedValue}</p>
            <p className="text-xs text-muted-foreground mt-1">{unit}</p>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 ${trendColors[trend]}`}>
              {trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;
