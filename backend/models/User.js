import mongoose from "mongoose";

const HealthSchema = new mongoose.Schema({
  city: String,
  conditions: [String],
  smoker: String,
  pregnant: String,
  aqiThreshold: Number,
  notifyBy: String,
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
