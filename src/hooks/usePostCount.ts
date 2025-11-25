import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PostCountData {
  postCount: number;
  treesPlanted: number;
  progressToNextTree: number;
  isLoading: boolean;
  error: string | null;
}

export function usePostCount(userId: string | null): PostCountData & { incrementPost: () => Promise<void> } {
  const [postCount, setPostCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const treesPlanted = Math.floor(postCount / 10);
  const progressToNextTree = postCount % 10;

  // Fetch current post count
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchPostCount = async () => {
      try {
        const { data, error } = await supabase
          .from("user_posts")
          .select("post_count")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;

        setPostCount(data?.post_count || 0);
      } catch (err) {
        console.error("Error fetching post count:", err);
        setError("Failed to fetch post count");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostCount();
  }, [userId]);

  // Increment post count
  const incrementPost = async () => {
    if (!userId) return;

    try {
      // Upsert: insert if not exists, update if exists
      const { data, error } = await supabase
        .from("user_posts")
        .upsert(
          {
            user_id: userId,
            post_count: postCount + 1,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) throw error;

      setPostCount(data.post_count);
    } catch (err) {
      console.error("Error incrementing post count:", err);
      setError("Failed to update post count");
      throw err;
    }
  };

  return {
    postCount,
    treesPlanted,
    progressToNextTree,
    isLoading,
    error,
    incrementPost,
  };
}
