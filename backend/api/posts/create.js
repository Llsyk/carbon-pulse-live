import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";
import User from "@/models/User";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

    const { userId, category, description, location } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const post = await Post.create({
      userId,
      author: user.name,
      category,
      description,
      location,
      photoUrl: "",
    });

    res.status(201).json({ message: "Post created", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
}
