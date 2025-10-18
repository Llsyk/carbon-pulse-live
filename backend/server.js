import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import requireAuth from "./middleware/requireAuth.js";




dotenv.config();

// ... other imports ...


//import { verifyMailer, checkAndSendOutingAlertForUser, startDailyOutingChecker } from "./utils/emailNotifier.js";
// import { checkAndNotifyAQI } from "./utils/aqiNotifier.js";
import { sendManualAlert, verifyMailer, startDailyManualAlert } from "./utils/emailNotifier.js";

console.log("DEBUG EMAIL_USER:", process.env.EMAIL_USER);
console.log("DEBUG EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded ✅" : "Missing ❌");
const app = express();



// --- CORS: allow your frontend origins (8080 + 127.0.0.1) ---
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      // "http://192.168.100.24:8080", // add if you open from LAN device
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// ⛔️ remove: app.options("*", cors());

app.use(express.json());

// --- DB connect ---
const { MONGODB_URI, PORT = 4000, JWT_SECRET } = process.env;
if (!MONGODB_URI) throw new Error("MONGODB_URI missing");
if (!JWT_SECRET) throw new Error("JWT_SECRET missing");

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((e) => {
    console.error("❌ Mongo error", e);
    process.exit(1);
  });

// --- Helpers ---
function makeToken(user) {
  return jwt.sign({ uid: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

// --- Routes ---
app.get("/", (req, res) => res.send("AQI API OK"));

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { account, health } = req.body || {};
    const { name, email, password, confirm } = account || {};

    if (!name || !email || !password || !confirm)
      return res.status(400).json({ error: "Missing required fields." });
    if (password !== confirm)
      return res.status(400).json({ error: "Passwords do not match." });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already used." });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      health: {
        city: health?.city ?? "",
        conditions: health?.conditions ?? [],
        smoker: health?.smoker ?? "",
        pregnant: health?.pregnant ?? "",
        aqiThreshold: Number(health?.aqiThreshold ?? 100),
        notifyBy: health?.notifyBy ?? "email",
      },
    });

    const token = makeToken(user);
    return res.status(201).json({
      message: "Account created",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        health: user.health,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials." });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials." });

    const token = makeToken(user);
    return res.json({
      message: "Logged in",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        health: user.health,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => console.log(`🚀 API on http://localhost:${PORT}`));
// Test route for sending AQI email
// Optional: test endpoint for the logged-in user (secure)
app.post("/api/notify/email", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const sent = await sendEmail(user);
    if (!sent) {
      return res.json({ message: "No email sent (missing email?)" });
    }
    return res.json({ message: "Test alert sent" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});


// Start cron if you want background checks (set enabled true/false)
//startDailyOutingChecker(true);

// Optionally verify mailer on server start (catch but don't crash)
verifyMailer().catch((e) => {
  console.warn("Mailer verification failed on startup:", e.message);
});
async function testEmail() {
  const user = await User.findOne(); // find any user
  if (!user) {
    console.log("❌ No users in DB yet!");
    return;
  }
  await sendManualAlert(user);
}

testEmail();
// app.get("/dev/test-aqi-notify", async (req, res) => {
//   try {
//     await checkAndNotifyAQI();
//     res.json({ ok: true, message: "AQI check executed, check console for details." });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ ok: false, error: e.message });
//   }
// });