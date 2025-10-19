// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import requireAuth from "./middleware/requireAuth.js";

// email notifier + scheduler functions
import emailNotifier, {
  scheduleOutingAlertsForUser,
  startAllOutingSchedules,
  verifyMailer,
  sendManualAlert,
  cancelOutingAlertsForUser,
} from "./utils/emailNotifier.js";

dotenv.config();

console.log("DEBUG EMAIL_USER:", process.env.EMAIL_USER);
console.log("DEBUG EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded ✅" : "Missing ❌");

const app = express();

// --- CORS: allow your frontend origins (8080 + 127.0.0.1) ---
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      // add LAN origin if needed
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// --- DB connect ---
const { MONGODB_URI, PORT = 4000, JWT_SECRET } = process.env;
if (!MONGODB_URI) throw new Error("MONGODB_URI missing");
if (!JWT_SECRET) throw new Error("JWT_SECRET missing");

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");

    // verify mailer connectivity
    try {
      await verifyMailer();
    } catch (e) {
      console.warn("Mailer verification failed on startup:", e?.message || e);
    }

    // schedule existing users' outings
    try {
      await startAllOutingSchedules();
    } catch (e) {
      console.error("Failed to start outing schedules:", e?.message || e);
    }

    // Optionally send a single test email on startup if you explicitly enable it
    // Set SEND_STARTUP_TEST_EMAIL=true in your .env to enable (will send to first user found)
    if (process.env.SEND_STARTUP_TEST_EMAIL === "true") {
      try {
        const anyUser = await User.findOne();
        if (anyUser) {
          console.log("Sending startup test email to", anyUser.email);
          await sendManualAlert(anyUser, { scheduledAt: "startup-test" });
        } else {
          console.log("No users in DB to send startup test email.");
        }
      } catch (e) {
        console.error("Startup test email failed:", e?.message || e);
      }
    }

    // start listening after DB + scheduler are ready
    app.listen(PORT, () => console.log(`🚀 API on http://localhost:${PORT}`));
  })
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

// Signup route (schedules outings for the new user)
app.post("/api/auth/signup", async (req, res) => {
  try {
    console.log(">>> Incoming signup body:", JSON.stringify(req.body, null, 2));

    const { account, health } = req.body || {};
    const { name, email, password, confirm } = account || {};

    if (!name || !email || !password || !confirm)
      return res.status(400).json({ error: "Missing required fields." });
    if (password !== confirm)
      return res.status(400).json({ error: "Passwords do not match." });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already used." });

    const passwordHash = await bcrypt.hash(password, 10);

    const rawOutings = Array.isArray(health?.outings) ? health.outings : [];
    const outings = rawOutings
      .map((t) => (typeof t === "string" ? t.trim().slice(0, 5) : ""))
      .filter((t) => /^\d{2}:\d{2}$/.test(t));

    const healthToSave = {
      city: health?.city ?? "",
      conditions: Array.isArray(health?.conditions) ? health.conditions : [],
      smoker: health?.smoker ?? "",
      pregnant: health?.pregnant ?? "",
      aqiThreshold: Number(health?.aqiThreshold ?? 100),
      notifyBy: health?.notifyBy ?? "email",
      outings,
    };

    const user = await User.create({
      name,
      email,
      passwordHash,
      health: healthToSave,
    });

    console.log("<<< Saved user.health.outings:", user.health?.outings);

    // Schedule outings for this new user (will cancel any existing scheduled jobs first)
    try {
      scheduleOutingAlertsForUser(user);
    } catch (err) {
      console.warn("Failed to schedule outings for new user:", err?.message || err);
    }

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
    console.error("Signup error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Login route
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

// Protected: send a manual/test email to the authenticated user
app.post("/api/notify/email", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Use sendManualAlert (previously sendEmail was used but not defined)
    const sent = await sendManualAlert(user, { scheduledAt: "manual-test" });
    if (!sent) {
      return res.json({ message: "No email sent (missing email or sending failed)" });
    }
    return res.json({ message: "Test alert sent" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

/*
  IMPORTANT:
  - If you have a route that updates user's outings, call scheduleOutingAlertsForUser(user)
    after saving the user so the jobs are refreshed.
  - If you delete a user or disable notifications, call cancelOutingAlertsForUser(userId)
    to stop scheduled jobs.
  - This scheduling uses an in-memory map (suitable for single-instance deployments).
    For multiple instances you should centralize scheduling (e.g., Redis queue / worker).
*/

export default app;
