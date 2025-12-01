import { useState } from "react";
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
import { Flame, Cloud, AlertTriangle, Upload, Loader2, Search, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Post {
  _id: string;
  userId: { _id: string; name: string };
  category: "fire" | "smoke" | "pollution" | "other";
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  image?: string;
  likes: number;
  comments: any[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  user: any;
  onPostUpdated: (updatedPost: Post) => void;
}

const CATEGORIES = [
  { id: "fire", label: "Fire", icon: Flame },
  { id: "smoke", label: "Visible Smoke", icon: Cloud },
  { id: "pollution", label: "Pollution Spike", icon: AlertTriangle },
  { id: "other", label: "Other", icon: AlertTriangle },
];

const API_URL = "http://localhost:4000";

export default function EditPostModal({ isOpen, onClose, post, user, onPostUpdated }: EditPostModalProps) {
  const [category, setCategory] = useState<"fire" | "smoke" | "pollution" | "other">(post.category);
  const [description, setDescription] = useState(post.description);
  const [location, setLocation] = useState(post.location);
  const [latitude, setLatitude] = useState(post.latitude);
  const [longitude, setLongitude] = useState(post.longitude);
  const [photo, setPhoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setPhoto(e.target.files[0]);
  };

  const geocodeLocation = async (locationQuery: string) => {
    if (!locationQuery.trim()) {
      toast({
        title: "Enter a location",
        description: "Please enter a location to search.",
      });
      return;
    }
    
    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setLatitude(parseFloat(data[0].lat));
        setLongitude(parseFloat(data[0].lon));
        setLocation(data[0].display_name);
        toast({
          title: "Location found!",
          description: data[0].display_name,
        });
      } else {
        toast({
          title: "Location not found",
          description: "Try a different search.",
        });
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Unable to search for location.",
      });
    } finally {
      setGeocoding(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        
        setLatitude(lat);
        setLongitude(lng);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const detected = data.display_name || `${lat}, ${lng}`;
          setLocation(detected);

          toast({
            title: "Location detected",
            description: detected,
          });
        } catch (err) {
          setLocation(`${lat}, ${lng}`);
          toast({
            title: "Location detected",
            description: "Unable to convert coordinates to address.",
          });
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        toast({
          title: "Location Permission Denied",
          description: "Please enable location access.",
        });
        setDetectingLocation(false);
      }
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("latitude", latitude.toString());
      formData.append("longitude", longitude.toString());

      if (photo) {
        formData.append("image", photo);
      }

      const res = await fetch(`${API_URL}/api/posts/${post._id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();

      toast({
        title: "Post Updated",
        description: "Your post has been updated successfully.",
      });

      onPostUpdated(data.post);
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not update post.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Category</Label>
            <RadioGroup value={category} onValueChange={(value) => setCategory(value as typeof category)}>
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
          </div>

          <div>
            <Label htmlFor="edit-location">Location</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="edit-location"
                placeholder="Type location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    geocodeLocation(location);
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => geocodeLocation(location)}
                disabled={geocoding}
                title="Search location"
              >
                {geocoding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={detectLocation}
                disabled={detectingLocation}
                title="Detect my location"
              >
                {detectingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </p>
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="What did you see?"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              maxLength={300}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">{description.length}/300 characters</p>
          </div>

          <div>
            <Label>Update Photo (optional)</Label>
            <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
              {photo ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{photo.name}</p>
                  <Button variant="outline" size="sm" onClick={() => setPhoto(null)}>Remove</Button>
                </div>
              ) : (
                <label htmlFor="edit-file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">Upload new photo</p>
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handlePhotoUpload}
                    className="sr-only"
                    id="edit-file-upload"
                  />
                  <Button variant="outline" size="sm" type="button">Choose File</Button>
                </label>
              )}
            </div>
            {post.image && !photo && (
              <p className="text-xs text-muted-foreground mt-2">Current image will be kept if no new photo is uploaded</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Updating..." : "Update Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
