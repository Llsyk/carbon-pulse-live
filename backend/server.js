// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

import http from "http";              // <-- for socket.io
import { Server as SocketServer } from "socket.io"; // <-- socket.io
import User from "./models/User.js";
import requireAuth from "./middleware/requireAuth.js";
import Post from "./models/Post.js";
import { sendIncidentAlert } from "./utils/incidentNotifier.js";

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
const server = http.createServer(app); // Wrap express app
const io = new SocketServer(server, {
  cors: {
    origin: ["http://localhost:8080", "http://127.0.0.1:8080"],
    credentials: true,
  },
});
// --- Multer: File Upload Storage ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder must exist
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // unique filename
  },
});

const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));

// --- Socket.IO: log connections ---
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});
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
    server.listen(PORT, () => console.log(`🚀 API on http://localhost:${PORT}`));
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

// Calculate distance between two coordinates using Haversine formula (returns km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

     // --- ASEAN Data (only in signup) ---
    const ASEAN_DATA = {
      Myanmar: [
    { city: "Yangon", lat: 16.8409, lng: 96.1735 },
    { city: "Mandalay", lat: 21.9588, lng: 96.0891 },
    { city: "Naypyidaw", lat: 19.7633, lng: 96.0785 },
    { city: "Taunggyi", lat: 20.7905, lng: 97.038 },
    { city: "Mawlamyine", lat: 16.474, lng: 97.628 },
  ],
  Thailand: [
    { city: "Bangkok", lat: 13.7563, lng: 100.5018 },
    { city: "Chiang Mai", lat: 18.7883, lng: 98.9853 },
    { city: "Phuket", lat: 7.8804, lng: 98.3923 },
    { city: "Pattaya", lat: 12.9236, lng: 100.8825 },
  ],
  Vietnam: [
    { city: "Hanoi", lat: 21.0278, lng: 105.8342 },
    { city: "Ho Chi Minh City", lat: 10.8231, lng: 106.6297 },
    { city: "Da Nang", lat: 16.0544, lng: 108.2022 },
    { city: "Hue", lat: 16.4637, lng: 107.5909 },
  ],
  Laos: [
    { city: "Vientiane", lat: 17.9757, lng: 102.6331 },
    { city: "Luang Prabang", lat: 19.8836, lng: 102.1343 },
    { city: "Pakse", lat: 15.1177, lng: 105.8183 },
  ],
  Cambodia: [
    { city: "Phnom Penh", lat: 11.5564, lng: 104.9282 },
    { city: "Siem Reap", lat: 13.355, lng: 103.8552 },
    { city: "Battambang", lat: 13.0957, lng: 103.2022 },
  ],
  Malaysia: [
    { city: "Kuala Lumpur", lat: 3.139, lng: 101.6869 },
    { city: "Penang", lat: 5.4164, lng: 100.3327 },
    { city: "Johor Bahru", lat: 1.4927, lng: 103.7414 },
    { city: "Kota Kinabalu", lat: 5.9804, lng: 116.0735 },
  ],
  Singapore: [{ city: "Singapore", lat: 1.3521, lng: 103.8198 }],
  Indonesia: [
    { city: "Jakarta", lat: -6.2088, lng: 106.8456 },
    { city: "Surabaya", lat: -7.2575, lng: 112.7521 },
    { city: "Bali (Denpasar)", lat: -8.65, lng: 115.2167 },
    { city: "Bandung", lat: -6.9175, lng: 107.6191 },
  ],
  Philippines: [
    { city: "Manila", lat: 14.5995, lng: 120.9842 },
    { city: "Cebu City", lat: 10.3157, lng: 123.8854 },
    { city: "Davao City", lat: 7.1907, lng: 125.4553 },
  ],
  Brunei: [
    { city: "Bandar Seri Begawan", lat: 4.9031, lng: 114.9398 },
    { city: "Kuala Belait", lat: 4.5833, lng: 114.2 },
  ],
    };

    // --- Get lat/lng from city ---
    if (!health?.country || !health?.city)
      return res.status(400).json({ error: "Country and city are required." });

    const cityData = ASEAN_DATA[health.country]?.find((c) => c.city === health.city);
    if (!cityData) return res.status(400).json({ error: "City data not found." });
    const rawOutings = Array.isArray(health?.outings) ? health.outings : [];
    const outings = rawOutings
      .map((t) => (typeof t === "string" ? t.trim().slice(0, 5) : ""))
      .filter((t) => /^\d{2}:\d{2}$/.test(t));

    const healthToSave = {
      country: health.country,
      city: health.city,
      lat: cityData.lat,
      lng: cityData.lng,
      conditions: Array.isArray(health.conditions) ? health.conditions : [],
      smoker: health.smoker ?? "",
      pregnant: health.pregnant ?? "",
      aqiThreshold: Number(health.aqiThreshold ?? 100),
      notifyBy: health.notifyBy ?? "email",
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
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name") // post author
      .populate("comments.userId", "name"); // comment author

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

app.post("/api/posts/create", upload.single("image"), async (req, res) => {
  console.log("req.body:", req.body);
  console.log("req.file:", req.file);

  try {
    const { userId, category, description, location, latitude, longitude } = req.body;
    if (!userId) return res.status(400).json({ message: "Missing userId" });
    if (!latitude || !longitude) return res.status(400).json({ message: "Missing location coordinates" });

    let imageUrl = null;
    if (req.file) imageUrl = `/uploads/${req.file.filename}`;

    const post = await Post.create({
      userId,
      category,
      description,
      location,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      image: imageUrl,
    });

    const populatedPost = await post.populate("userId", "name");

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { postCount: 1 } },
      { new: true }
    );

    io.emit("new-post", populatedPost);

    // Send email alerts to nearby users
    const ALERT_RADIUS_KM = 20; // Alert users within 20km
    const postLat = parseFloat(latitude);
    const postLon = parseFloat(longitude);
    
    // Find all users who want email notifications (excluding post author)
    const allUsers = await User.find({ 
      _id: { $ne: userId },
      'health.notifyBy': 'email'
    });

    const nearbyUsers = allUsers.filter(u => {
      if (u.health?.lat && u.health?.lng) {
        const distance = calculateDistance(postLat, postLon, u.health.lat, u.health.lng);
        return distance <= ALERT_RADIUS_KM;
      }
      return false;
    });

    // Send emails asynchronously (don't block response)
    if (nearbyUsers.length > 0) {
      setImmediate(async () => {
        for (const nearbyUser of nearbyUsers) {
          try {
            const distance = calculateDistance(postLat, postLon, nearbyUser.health.lat, nearbyUser.health.lng);
            
           await sendIncidentAlert(nearbyUser, {
  category,
  location,
  description,
  distance: distance.toFixed(1)
});

            console.log(`✓ Sent alert to ${nearbyUser.email} (${distance.toFixed(1)}km away)`);
          } catch (emailErr) {
            console.error(`✗ Failed to send email to ${nearbyUser.email}:`, emailErr.message);
          }
        }
      });
    }

    return res.status(201).json({
      message: "Post created",
      post: populatedPost,
      postCount: user?.postCount || 0,
    });
  } catch (err) {
    console.error("POST CREATE ERROR:", err);
    return res.status(500).json({ message: "Failed to create post" });
  }
});



// Get user's post count
app.get("/api/users/:userId/post-count", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({ postCount: user.postCount || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch post count" });
  }
});

// Like a post
app.post("/api/posts/:postId/like", async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findByIdAndUpdate(
      postId,
      { $inc: { likes: 1 } },
      { new: true }
    ).populate("userId", "name");
    
    if (!post) return res.status(404).json({ message: "Post not found" });
    
    io.emit("post-updated", post);
    res.json({ likes: post.likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to like post" });
  }
});

// Add comment to post
app.post("/api/posts/:id/comment", async (req, res) => {
  try {
    const { userId, text } = req.body;
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ userId, text });
    await post.save();

    // Populate after save to get full user details
    const populated = await Post.findById(id)
      .populate("userId", "name")
      .populate("comments.userId", "name");

    // Emit real-time update
    io.emit("post-updated", populated);

    res.json({ message: "Comment added", post: populated });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Failed to add comment" });
  }
});

// Edit post
app.put("/api/posts/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, category, description, location, latitude, longitude } = req.body;
    
    const post = await Post.findById(id).populate("userId", "name");
    if (!post) return res.status(404).json({ message: "Post not found" });
    
    // Check if user owns the post
    if (post.userId._id.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to edit this post" });
    }
    
    // Update fields
    post.category = category;
    post.description = description;
    post.location = location;
    post.latitude = parseFloat(latitude);
    post.longitude = parseFloat(longitude);
    
    if (req.file) {
      post.image = `/uploads/${req.file.filename}`;
    }
    
    await post.save();
    const updated = await Post.findById(id).populate("userId", "name").populate("comments.userId", "name");
    
    io.emit("post-updated", updated);
    res.json({ message: "Post updated", post: updated });
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ message: "Failed to update post" });
  }
});

// Delete post
app.delete("/api/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    
    // Check if user owns the post
    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }
    
    await Post.findByIdAndDelete(id);
    io.emit("post-deleted", { postId: id });
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Failed to delete post" });
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
