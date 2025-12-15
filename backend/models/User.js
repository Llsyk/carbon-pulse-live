import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const HealthSchema = new mongoose.Schema({
  country: { type: String, required: true },
  city: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  conditions: { type: [String], default: [] },
  aqiThreshold: { type: Number, default: 100 },
  notifyBy: { type: String, enum: ["email", "sms", "push"], default: "email" },
  phone: {type: String, default: ""},
  outings: { type: [String], default: [] },
  lastNotified: {
    type: Map,
    of: [String],
    default: {},
  },
});

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    health: { type: HealthSchema, required: true },
    postCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Optional: virtual for setting password
UserSchema.virtual("password").set(function (password) {
  this._password = password;
  this.passwordHash = bcrypt.hashSync(password, 10);
});

export default mongoose.model("User", UserSchema);
