import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// CommentModal.tsx
export default function CommentModal({ post, user, onClose, onCommentAdded }) {
  const [text, setText] = useState("");

  const submitComment = async () => {
    if (!text.trim()) return;

    const userId = user?._id || user?.id;
    if (!userId) {
      alert("User not found. Please log in again.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/posts/${post._id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text }),
      });
      const data = await res.json();

      if (res.ok && data.post) {
        // notify parent
        onCommentAdded?.(data.post.comments[data.post.comments.length - 1]);
      }
    } catch (err) {
      console.error("Failed to submit comment:", err);
    }

    setText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">
          Comment on {post?.userId?.name || "this"} post
        </h3>

        <Input 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="mb-4"
        />

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submitComment}>Submit</Button>
        </div>
      </div>
    </div>
  );
}
