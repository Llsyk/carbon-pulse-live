import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SummaryTileProps {
  title: string;
  value: number;
  target: number;
  unit?: string;
}

const SummaryTile = ({ title, value, target, unit = 'MTCO₂e' }: SummaryTileProps) => {
  const percentage = Math.min((value / target) * 100, 100);
  const isOverTarget = value > target;
  
  const formattedValue = new Intl.NumberFormat('en-US').format(value);
  const formattedTarget = new Intl.NumberFormat('en-US').format(target);

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-foreground">{formattedValue}</p>
            <p className="text-xs text-muted-foreground">{unit}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Target: {formattedTarget}</span>
              <span className={isOverTarget ? 'text-destructive' : 'text-success'}>
                {percentage.toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={percentage} 
              className="h-2"
              indicatorClassName={isOverTarget ? 'bg-destructive' : 'bg-success'}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryTile;
