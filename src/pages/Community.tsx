import { useEffect, useState } from "react";
import { io } from "socket.io-client";
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
  image?: string; // must match backend field name

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
    const socket = io(API_URL);

    // Helper to normalize post
    const normalizePost = (p: any): Post | null => {
      if (!p.userId || !p.userId.name) return null;
      return {
        ...p,
        userId: { _id: p.userId._id, name: p.userId.name },
      };
    };

    // Fetch initial posts
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/posts`);
        const data = await res.json();

        const normalized = (data.posts || data)
          .map(normalizePost)
          .filter((p): p is Post => p !== null); // filter out nulls

        setPosts(normalized);
      } catch (err) {
        console.error("Failed to fetch posts", err);
      }
    };

    fetchPosts();

    // Listen for new posts
    socket.on("new-post", (post: Post) => {
      const normalized = normalizePost(post);
      if (normalized) {
        setPosts(prev => [normalized, ...prev]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!posts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Community Feed</h1>
          <p className="text-muted-foreground">
            Stay informed about safety incidents in your area
          </p>
        </div>

        <ReportButton />

        <div className="space-y-4 mt-6">
          {posts.map((post) => {
            const categoryConfig = CATEGORY_CONFIG[post.category];
            const CategoryIcon = categoryConfig.icon;

            return (
              <Card key={post._id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {post.userId.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{post.userId.name}</p>
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

                <p className="text-foreground mb-4">{post.description}</p>
                {post.image && (
  <img
    src={`${API_URL}${post.image}`}
    alt="post"
    className="w-full h-auto rounded-lg mb-4 border"
  />
)}

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{post.location}</span>
                </div>

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
