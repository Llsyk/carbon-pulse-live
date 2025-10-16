import mongoose from "mongoose";

const HealthSchema = new mongoose.Schema({
  city: { type: String, default: "" },
  conditions: { type: [String], default: [] },
  smoker: { type: String, enum: ["no", "former", "yes", ""], default: "" },
  pregnant: { type: String, enum: ["no", "yes", ""], default: "" },
  aqiThreshold: { type: Number, default: 100 },
  notifyBy: { type: String, enum: ["email", "sms", "push"], default: "email" },
});

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    health: { type: HealthSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
