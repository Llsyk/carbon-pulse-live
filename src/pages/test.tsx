import { useEffect, useState } from "react";
import { io } from "socket.io-client"; // <-- import socket.io client
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Flame, Cloud, AlertTriangle, ThumbsUp, MessageSquare } from "lucide-react";
import ReportButton from "@/components/ReportButton";

interface Post {
  _id: string;
  userId: { _id: string; name: string };
  category: "fire" | "smoke" | "pollution" | "other";
  description: string;
  location: string;
  photoUrl?: string;
  likes: number;
  comments: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_CONFIG = {
  fire: { icon: Flame, color: "destructive", label: "Fire" },
  smoke: { icon: Cloud, color: "default", label: "Smoke" },
  pollution: { icon: AlertTriangle, color: "secondary", label: "Pollution" },
  other: { icon: AlertTriangle, color: "default", label: "Other" },
};

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const API_URL = "http://localhost:4000";

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(`${API_URL}/api/posts`);
        const data = await res.json();
        setPosts(data.posts || data);
      } catch (error) {
        console.error("Failed to fetch posts", error);
      }
    }
    fetchPosts();

    // --- SOCKET.IO SETUP ---
    const socket = io(API_URL);

    // Listen for new posts
    socket.on("new-post", (post: Post) => {
      setPosts((prev) => [post, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Community Feed</h1>
          <p className="text-muted-foreground">
            Stay informed about safety incidents in your area
          </p>
        </div>

        {/* Report Button */}
        <ReportButton />

        {/* Posts List */}
        <div className="space-y-4 mt-6">
          {posts.map((post) => {
            const categoryConfig = CATEGORY_CONFIG[post.category];
            const CategoryIcon = categoryConfig.icon;

            return (
              <Card key={post._id} className="p-6 hover:shadow-lg transition-shadow">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {post.userId?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{post.userId?.name || "Unknown"}</p>
                        {post.isVerified && (
                          <Badge variant="secondary" className="text-xs">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleTimeString()}
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
