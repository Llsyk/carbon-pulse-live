// backend/models/User.js
import mongoose from "mongoose";

const HealthSchema = new mongoose.Schema({
  city: String,
  conditions: [String],
  smoker: String,
  pregnant: String,
  aqiThreshold: { type: Number, default: 100 },
  notifyBy: { type: String, enum: ["email", "sms", "push"], default: "email" },
  outings: { type: [String], default: [] }, // ["07:30","18:00"]
  lastNotified: {
    // keep a per-date map to avoid duplicate per-day notifications
    type: Map,
    of: [String], // list of outing times already notified for a given date (YYYY-MM-DD -> ["07:30"])
  },
});

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    health: HealthSchema,
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
