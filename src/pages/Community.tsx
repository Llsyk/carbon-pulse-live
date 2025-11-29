import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Flame, Cloud, AlertTriangle, ThumbsUp, MessageSquare, Map } from "lucide-react";
import ReportButton from "@/components/ReportButton";

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
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
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

    // Listen for post updates (likes, comments)
    socket.on("post-updated", (updatedPost: Post) => {
      const normalized = normalizePost(updatedPost);
      if (normalized) {
        setPosts(prev => prev.map(p => p._id === normalized._id ? normalized : p));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredPosts = selectedCategory === "all" 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  const handleViewOnMap = (post: Post) => {
    const params = new URLSearchParams({
      lat: post.latitude.toString(),
      lng: post.longitude.toString(),
      location: post.location,
      category: post.category,
      description: post.description,
      userName: post.userId.name,
    });
    navigate(`/post-location?${params.toString()}`);
  };

  const handleLike = async (postId: string) => {
    if (likingPosts.has(postId)) return;
    
    setLikingPosts(prev => new Set(prev).add(postId));
    try {
      await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to like post:", error);
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleComment = async (postId: string) => {
    try {
      await fetch(`${API_URL}/api/posts/${postId}/comment`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-3">Community Feed</h1>
          <p className="text-lg opacity-90">
            Stay informed about safety incidents in your area
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Report Button */}
        <div className="mb-6">
          <ReportButton />
        </div>

        {/* Category Filter */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="fire">
              <Flame className="h-4 w-4 mr-1" />
              Fire
            </TabsTrigger>
            <TabsTrigger value="smoke">
              <Cloud className="h-4 w-4 mr-1" />
              Smoke
            </TabsTrigger>
            <TabsTrigger value="pollution">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Pollution
            </TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Posts List */}
        {filteredPosts.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground">
              {selectedCategory === "all" 
                ? "Be the first to report an incident in your area." 
                : `No ${selectedCategory} incidents reported yet.`}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => handleLike(post._id)}
                    disabled={likingPosts.has(post._id)}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {post.likes}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => handleComment(post._id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {post.comments}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-auto gap-2"
                    onClick={() => handleViewOnMap(post)}
                  >
                    <Map className="h-4 w-4" />
                    View on Map
                  </Button>
                </div>
              </Card>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
