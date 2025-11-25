import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface PostCountData {
  postCount: number;
  treesPlanted: number;
  progressToNextTree: number;
  isLoading: boolean;
  error: string | null;
}

export function usePostCount(userId: string | null): PostCountData {
  const [postCount, setPostCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const treesPlanted = Math.floor(postCount / 10);
  const progressToNextTree = postCount % 10;

  // Fetch current post count from MongoDB
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchPostCount = async () => {
      try {
        const data = await api<{ postCount: number }>(`/api/users/${userId}/post-count`);
        setPostCount(data.postCount || 0);
      } catch (err) {
        console.error("Error fetching post count:", err);
        setError("Failed to fetch post count");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostCount();
  }, [userId]);

  return {
    postCount,
    treesPlanted,
    progressToNextTree,
    isLoading,
    error,
  };
}
