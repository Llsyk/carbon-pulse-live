import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Flame, Cloud, AlertTriangle, ThumbsUp, MessageSquare } from "lucide-react";

interface Post {
  id: string;
  author: string;
  category: "fire" | "smoke" | "pollution" | "other";
  description: string;
  location: string;
  distance: string;
  timestamp: string;
  likes: number;
  comments: number;
  isVerified: boolean;
}

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    author: "Sarah M.",
    category: "smoke",
    description: "Thick smoke coming from the industrial area. Visibility very low.",
    location: "Downtown District",
    distance: "0.5 km away",
    timestamp: "15 min ago",
    likes: 12,
    comments: 3,
    isVerified: true,
  },
  {
    id: "2",
    author: "John D.",
    category: "pollution",
    description: "Air quality dropped significantly this morning. Breathing difficulties reported.",
    location: "Central Park",
    distance: "1.2 km away",
    timestamp: "1 hour ago",
    likes: 24,
    comments: 8,
    isVerified: true,
  },
  {
    id: "3",
    author: "Maria L.",
    category: "fire",
    description: "Small fire spotted near the market area. Fire department has been notified.",
    location: "Main Market",
    distance: "2.8 km away",
    timestamp: "3 hours ago",
    likes: 45,
    comments: 15,
    isVerified: true,
  },
];

const CATEGORY_CONFIG = {
  fire: { icon: Flame, color: "destructive", label: "Fire" },
  smoke: { icon: Cloud, color: "default", label: "Smoke" },
  pollution: { icon: AlertTriangle, color: "secondary", label: "Pollution" },
  other: { icon: AlertTriangle, color: "default", label: "Other" },
};

export default function Community() {
  const [posts] = useState<Post[]>(MOCK_POSTS);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Community Feed</h1>
          <p className="text-muted-foreground">
            Stay informed about safety incidents in your area
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">127</p>
            <p className="text-sm text-muted-foreground">Active Reports</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-secondary">89</p>
            <p className="text-sm text-muted-foreground">Trees Planted</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">5.2k</p>
            <p className="text-sm text-muted-foreground">Community Members</p>
          </Card>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map((post) => {
            const categoryConfig = CATEGORY_CONFIG[post.category];
            const CategoryIcon = categoryConfig.icon;

            return (
              <Card key={post.id} className="p-6 hover:shadow-lg transition-shadow">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {post.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{post.author}</p>
                        {post.isVerified && (
                          <Badge variant="secondary" className="text-xs">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {post.timestamp}
                      </p>
                    </div>
                  </div>
                  <Badge variant={categoryConfig.color as any}>
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {categoryConfig.label}
                  </Badge>
                </div>

                {/* Post Content */}
                <p className="text-foreground mb-4">{post.description}</p>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{post.location}</span>
                  <span>•</span>
                  <span>{post.distance}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ThumbsUp className="h-4 w-4" />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {post.comments}
                  </Button>
                  <Button variant="ghost" size="sm" className="ml-auto">
                    View on Map
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
