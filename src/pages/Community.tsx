import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Flame, Cloud, AlertTriangle, ThumbsUp, MessageSquare, Map, Pencil, Trash2 } from "lucide-react";
import ReportButton from "@/components/ReportButton";
import CommentModal from "@/components/CommentModal";
import EditPostModal from "@/components/EditPostModal";
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
  comments: {
  _id: string;
  userId: { _id: string; name: string };
  text: string;
  createdAt: string;
}[];

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
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [openCommentModal, setOpenCommentModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [openEditModal, setOpenEditModal] = useState(false);

  const API_URL = "http://localhost:4000";

  useEffect(() => {
    const socket = io(API_URL);

    // Helper to normalize post
    const normalizePost = (p: any): Post | null => {
      if (!p.userId || !p.userId.name) return null;
     return {
    ...p,
    userId: { _id: p.userId._id, name: p.userId.name },
    comments: (p.comments || []).map((c: any) => {
      // Use real userId if exists, otherwise fallback
      const commentUser = c.userId && c.userId.name 
        ? { _id: c.userId._id, name: c.userId.name } 
        : { _id: "", name: "Unknown" };

      return {
        _id: c._id,
        text: c.text,
        createdAt: c.createdAt,
        userId: commentUser
      };
    })
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

    // Listen for post deletions
    socket.on("post-deleted", ({ postId }: { postId: string }) => {
      setPosts(prev => prev.filter(p => p._id !== postId));
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
  const handleCommentAdded = (newComment: Post["comments"][0]) => {
    if (!activePost) return;
    setPosts(prev =>
      prev.map(post =>
        post._id === activePost._id
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
    );
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast({
        title: "Post Deleted",
        description: "Your post has been removed.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not delete post.",
      });
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setOpenEditModal(true);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
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

  // Fallbacks for user
  const postUserName = post.userId?.name ?? "Unknown";

  return (
    <Card key={post._id} className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {postUserName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{postUserName}</p>
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
        <div className="flex items-center gap-2">
          <Badge variant={categoryConfig.color as any}>
            <CategoryIcon className="h-3 w-3 mr-1" />
            {categoryConfig.label}
          </Badge>
          {user && post.userId._id === user.id && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEditPost(post)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDeletePost(post._id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
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
          onClick={() => {
            setActivePost(post);
            setOpenCommentModal(true);
          }}
        >
          <MessageSquare className="h-4 w-4" />
          {post.comments.length}
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

      {/* Comments Section */}
      <div className="mt-4 border-t border-border pt-4 space-y-2">
        {post.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet</p>
        ) : (
          post.comments.map(comment => {
            const commentUserName = comment.userId?.name ?? "Unknown";

            return (
              <div key={comment._id} className="flex items-start gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {commentUserName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{commentUserName}</p>
                  <p className="text-sm text-muted-foreground">{comment.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
})}


          
          </div>
          
        )}
        
      </div>
      {openCommentModal && activePost && (
        <CommentModal
          post={activePost}
          user={user}
          onClose={() => {
            setOpenCommentModal(false);
            setActivePost(null);
          }}
          onCommentAdded={handleCommentAdded}
        />
      )}

      {openEditModal && editingPost && user && (
        <EditPostModal
          isOpen={openEditModal}
          onClose={() => {
            setOpenEditModal(false);
            setEditingPost(null);
          }}
          post={editingPost}
          user={user}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </div>
  );
}
