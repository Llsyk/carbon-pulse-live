import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PostProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progressToNextTree: number;
  userName?: string;
}

export default function PostProgressModal({
  isOpen,
  onClose,
  progressToNextTree,
  userName,
}: PostProgressModalProps) {
  const progressPercent = (progressToNextTree / 10) * 100;

  const getMessage = () => {
    if (progressToNextTree <= 3) {
      return "Great start! Keep reporting to help your community.";
    } else if (progressToNextTree <= 6) {
      return "You're making a difference! Halfway to your next tree.";
    } else {
      return `Almost there! Just ${10 - progressToNextTree} more ${
        10 - progressToNextTree === 1 ? "report" : "reports"
      } for your next tree.`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] text-center">
        <DialogHeader>
          <DialogTitle className="text-center">Great job! 🌱</DialogTitle>
        </DialogHeader>

        <div className="py-8 space-y-6">
          {/* Animated Growing Seedling */}
          <div className="relative w-24 h-24 mx-auto animate-scale-in">
            <div className="text-7xl animate-bounce">🌱</div>
            <div className="absolute -top-2 -right-2 animate-pulse">
              <div className="text-2xl animate-fade-in">✨</div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-3">
            <h3 className="text-2xl font-semibold">
              {progressToNextTree}/10 toward your next tree
            </h3>
            
            <div className="space-y-2">
              <Progress 
                value={progressPercent} 
                className="h-3"
                indicatorClassName="bg-gradient-to-r from-primary to-secondary transition-all duration-500"
              />
              <p className="text-sm text-muted-foreground">
                {10 - progressToNextTree} more {10 - progressToNextTree === 1 ? "report" : "reports"} to plant a tree
              </p>
            </div>
          </div>

          {/* Motivational Message */}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-4">
            <p className="text-foreground">{getMessage()}</p>
          </div>

          {userName && (
            <p className="text-xs text-muted-foreground">
              Keep going, {userName}!
            </p>
          )}
        </div>

        <Button onClick={onClose} className="w-full">
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
