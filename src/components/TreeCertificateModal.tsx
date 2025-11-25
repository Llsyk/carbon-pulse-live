import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Twitter } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TreeCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  treesPlanted: number;
  userName?: string;
}

export default function TreeCertificateModal({
  isOpen,
  onClose,
  treesPlanted,
  userName,
}: TreeCertificateModalProps) {
  const handleShare = (platform: string) => {
    const message = `I just planted ${treesPlanted} ${
      treesPlanted === 1 ? "tree" : "trees"
    } by reporting safety incidents in my community! 🌳`;
    
    if (platform === "Twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
        "_blank"
      );
    } else if (platform === "Facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          window.location.href
        )}&quote=${encodeURIComponent(message)}`,
        "_blank"
      );
    }
    
    toast({
      title: "Shared!",
      description: `Certificate shared on ${platform}`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] text-center">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            🎉 Congratulations! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="py-8 space-y-6">
          {/* Tree Icons */}
          <div className="flex justify-center gap-2 text-6xl animate-scale-in">
            {Array.from({ length: Math.min(treesPlanted, 5) }).map((_, i) => (
              <span
                key={i}
                className="animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                🌳
              </span>
            ))}
            {treesPlanted > 5 && (
              <span className="text-4xl self-center animate-fade-in">
                +{treesPlanted - 5} more
              </span>
            )}
          </div>

          {/* Certificate */}
          <div className="relative bg-gradient-to-br from-primary/5 to-secondary/5 border-4 border-primary/30 rounded-2xl p-8 shadow-lg animate-fade-in">
            {/* Decorative corners */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-primary/50 rounded-tl-lg" />
            <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-primary/50 rounded-tr-lg" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-primary/50 rounded-bl-lg" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-primary/50 rounded-br-lg" />

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-primary uppercase tracking-wide">
                Certificate of Impact
              </h2>
              
              <div className="space-y-3 py-4">
                <h3 className="text-3xl font-bold text-foreground">
                  We planted {treesPlanted} {treesPlanted === 1 ? "tree" : "trees"}
                </h3>
                <p className="text-xl text-foreground">in your name!</p>
                
                {userName && (
                  <p className="text-2xl font-semibold text-primary pt-2">
                    {userName}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-primary/20">
                <p className="text-sm text-muted-foreground">
                  For your dedication to community safety
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Certified: {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Celebration Message */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-4">
            <p className="text-foreground font-medium">
              Thank you for making your community safer! Your reports help protect lives. 🌟
            </p>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Share your achievement:</p>
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
                navigator.clipboard.writeText(
                  `I just planted ${treesPlanted} ${
                    treesPlanted === 1 ? "tree" : "trees"
                  } by reporting safety incidents! ${window.location.href}`
                );
                toast({ title: "Link copied to clipboard!" });
              }}
              className="w-full"
            >
              Copy Link
            </Button>
          </div>
        </div>

        <Button onClick={onClose} className="w-full" size="lg">
          Continue Making a Difference
        </Button>
      </DialogContent>
    </Dialog>
  );
}
