import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Flame, Cloud, AlertTriangle, Upload, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PostProgressModal from "./PostProgressModal";
import TreeCertificateModal from "./TreeCertificateModal";
import { usePostCount } from "@/hooks/usePostCount";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const CATEGORIES = [
  { id: "fire", label: "Fire", icon: Flame },
  { id: "smoke", label: "Visible Smoke", icon: Cloud },
  { id: "pollution", label: "Pollution Spike", icon: AlertTriangle },
  { id: "other", label: "Other", icon: AlertTriangle },
];

const API_URL = "http://localhost:4000";
const socket: Socket = io(API_URL); // Single socket instance for client

export default function ReportModal({ isOpen, onClose, user }: ReportModalProps) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [shareExactLocation, setShareExactLocation] = useState(true);
  const [photo, setPhoto] = useState<File | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  const { postCount = 0 } = usePostCount(user?.id || null);
  const [newPostCount, setNewPostCount] = useState<number>(0);

  // Update newPostCount whenever postCount changes
  useEffect(() => {
    setNewPostCount(postCount);
  }, [postCount]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setPhoto(e.target.files[0]);
  };

  const resetForm = () => {
    setStep(1);
    setCategory("");
    setDescription("");
    setLocation("");
    setPhoto(null);
    setShareExactLocation(true);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "You must login", description: "Please login to submit a report." });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/posts/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, category, description, location }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json();

      const count = data.postCount || 0;
      setNewPostCount(count);

      // Emit the new post to server for socket broadcast
      socket.emit("post-created", data.post);

      const newProgress = count % 10;
      setTimeout(() => {
        if (newProgress === 0) setShowCertificateModal(true);
        else setShowProgressModal(true);
      }, 500);

      toast({ title: "Report Submitted", description: "Your report has been shared with the community." });
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Could not submit report." });
    }
  };

  const handleModalClose = () => {
    setShowProgressModal(false);
    setShowCertificateModal(false);
    onClose();
    resetForm();
  };

  return (
    <>
      <Dialog open={isOpen && !showProgressModal && !showCertificateModal} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Report an Incident - Step {step} of 3</DialogTitle>
          </DialogHeader>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <Label>What happened?</Label>
              <RadioGroup value={category} onValueChange={setCategory}>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                          category === cat.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value={cat.id} />
                        <Icon className="h-5 w-5" />
                        <span className="text-sm">{cat.label}</span>
                      </label>
                    );
                  })}
                </div>
              </RadioGroup>
              <Button onClick={() => setStep(2)} disabled={!category} className="w-full">Next</Button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <Label htmlFor="location">Where & When?</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="location"
                  placeholder="Enter address or use current location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setLocation("Current Location (Auto-detected)");
                    toast({ title: "Location detected", description: "Using your current location" });
                  }}
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
              <Label htmlFor="description">Details (optional, max 300 chars)</Label>
              <Textarea
                id="description"
                placeholder="What did you see?"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                maxLength={300}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">{description.length}/300 characters</p>
              <div className="flex items-center justify-between">
                <Label htmlFor="share-location">Share exact location</Label>
                <Switch id="share-location" checked={shareExactLocation} onCheckedChange={setShareExactLocation} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={() => setStep(3)} disabled={!location} className="flex-1">Next</Button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <Label>Proof (optional)</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                {photo ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{photo.name}</p>
                    <Button variant="outline" size="sm" onClick={() => setPhoto(null)}>Remove</Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Upload photo or video</p>
                    <Input type="file" accept="image/*,video/*" onChange={handlePhotoUpload} className="hidden" />
                    <Button variant="outline" size="sm" type="button">Choose File</Button>
                  </label>
                )}
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Summary</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Category:</dt>
                    <dd className="font-medium">{CATEGORIES.find((c) => c.id === category)?.label}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Location:</dt>
                    <dd className="font-medium">{location}</dd>
                  </div>
                  {description && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Details:</dt>
                      <dd className="font-medium">{description.substring(0, 30)}...</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                <Button onClick={handleSubmit} className="flex-1">Submit Report</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PostProgressModal
        isOpen={showProgressModal}
        onClose={handleModalClose}
        progressToNextTree={newPostCount % 10}
        userName={user?.name}
      />

      <TreeCertificateModal
        isOpen={showCertificateModal}
        onClose={handleModalClose}
        treesPlanted={Math.floor(newPostCount / 10)}
        userName={user?.name}
      />
    </>
  );
}
