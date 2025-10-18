import dotenv from "dotenv";
import { sendManualAlert } from "./utils/emailNotifier.js";
import mongoose from "mongoose";
import User from "./models/User.js";

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("✅ MongoDB connected");

  const user = await User.findOne(); // pick any user
  if (!user) {
    console.error("No user found");
    process.exit(1);
  }

  try {
    await sendManualAlert(user);
    console.log("✅ Test email sent successfully");
    process.exit(0);
  } catch (e) {
    console.error("❌ Test email failed:", e.message);
    process.exit(1);
  }
});
