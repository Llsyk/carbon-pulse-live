import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { TreePine, FileText, Award } from "lucide-react";

interface UserStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  postCount: number;
  treesPlanted: number;
}

export default function UserStatsModal({
  isOpen,
  onClose,
  userName,
  postCount,
  treesPlanted,
}: UserStatsModalProps) {
  const progressToNextTree = postCount % 10;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {userName}'s Impact
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-full">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{postCount}</p>
                <p className="text-sm text-muted-foreground">Total Posts</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/10">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/20 p-3 rounded-full">
                <TreePine className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{treesPlanted}</p>
                <p className="text-sm text-muted-foreground">Trees Planted</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-secondary/10 to-primary/10">
            <div className="flex items-center gap-4">
              <div className="bg-secondary/20 p-3 rounded-full">
                <Award className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  Progress to Next Tree
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-500"
                      style={{ width: `${(progressToNextTree / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {progressToNextTree}/10
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Keep posting to plant more trees! 🌱
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Every 10 posts = 1 tree planted in your name
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
