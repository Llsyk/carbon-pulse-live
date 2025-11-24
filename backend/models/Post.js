import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
   
    category: { type: String, enum: ["fire", "smoke", "pollution", "other"], required: true },
    description: { type: String, default: "" },
    location: { type: String, required: true },
    photoUrl: { type: String, default: "" },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
