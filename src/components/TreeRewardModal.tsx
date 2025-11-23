import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Twitter } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TreeRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TreeRewardModal({ isOpen, onClose }: TreeRewardModalProps) {
  const handleShare = (platform: string) => {
    toast({
      title: "Shared!",
      description: `Badge shared on ${platform}`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] text-center">
        <DialogHeader>
          <DialogTitle className="text-center">Thank You! 🌱</DialogTitle>
        </DialogHeader>

        <div className="py-8">
          {/* Animated Tree */}
          <div className="relative w-32 h-32 mx-auto mb-6 animate-scale-in">
            <div className="text-8xl animate-bounce">🌳</div>
            <div className="absolute inset-0 animate-pulse">
              <div className="text-4xl absolute top-0 right-0 animate-fade-in">🍃</div>
              <div className="text-3xl absolute bottom-0 left-0 animate-fade-in [animation-delay:0.3s]">🍃</div>
              <div className="text-3xl absolute top-1/4 left-1/4 animate-fade-in [animation-delay:0.6s]">✨</div>
            </div>
          </div>

          {/* Badge */}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20 rounded-2xl p-6 mb-6 animate-fade-in">
            <h3 className="text-xl font-semibold mb-2">
              We Planted a Symbolic Tree in Your Name
            </h3>
            <p className="text-muted-foreground mb-4">
              Thanks for making your community safer. Your report helps protect lives.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="font-medium">Certified:</span>
              <span className="text-muted-foreground">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">Share your impact:</p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => handleShare("Twitter")}
                className="flex-1"
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("Facebook")}
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Facebook
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({ title: "Link copied!" });
              }}
              className="w-full"
            >
              Copy Link
            </Button>
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
