// backend/utils/emailNotifier.js
import nodemailer from "nodemailer";
import User from "../models/User.js";
import cron from "node-cron";

/**
 * 🔧 Create a Gmail transporter dynamically
 */
function makeTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) throw new Error("Missing EMAIL_USER or EMAIL_PASS in .env");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

/** ✅ Verify mailer connectivity */
export async function verifyMailer() {
  try {
    const transporter = makeTransporter();
    await transporter.verify();
    console.log("✅ Mailer ready (Gmail SMTP)");
  } catch (err) {
    console.error("Mailer verify failed:", err.message);
  }
}

/** ✉️ Internal: Send email to a user */
async function sendMail(user, subject, html) {
  if (!user?.email) {
    console.warn("⚠️ No email found for this user:", user?._id || "unknown user");
    return null;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(user.email)) {
    console.warn("⚠️ Invalid email format:", user.email);
    return null;
  }

  try {
    const transporter = makeTransporter();
    const mailOptions = {
      from: `"CypherX AQI" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Sent to ${user.email} — messageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error("❌ Failed to send email to", user.email, err.message);
    return null;
  }
}

/**
 * 🧪 Manual alert: send test email to user
 */
export async function sendManualAlert(user, opts = {}) {
  if (!user?.email) {
    console.warn("⚠️ No email found for this user:", user?._id || "unknown user");
    return null;
  }

 const userName = user.name || "User";
const city = user.health?.city || "your city";
const aqi = opts.aqi || 150;
const scheduledAt = opts.scheduledAt || "your outing time";
const threshold = user.health?.aqiThreshold || 100;
const conditions = user.health?.conditions || [];

// 🩺 Add custom advice based on health conditions
let conditionAdvice = "";
if (conditions.includes("asthma")) {
  conditionAdvice += `
    <li><strong>Asthma alert:</strong> Poor air quality can trigger asthma attacks. 
    Please carry your inhaler and avoid strenuous outdoor activity.</li>
  `;
}
if (conditions.includes("allergies")) {
  conditionAdvice += `
    <li><strong>Allergy warning:</strong> High pollution can worsen allergy symptoms. 
    Try to stay indoors and use an air purifier if possible.</li>
  `;
}
if (!conditionAdvice) {
  conditionAdvice = `
    <li>Maintain hydration and limit time outdoors during high AQI levels.</li>
  `;
}

// 🧠 Set AQI level message
let aqiStatus = "Moderate";
if (aqi > 200) aqiStatus = "Very Unhealthy";
else if (aqi > 150) aqiStatus = "Unhealthy";
else if (aqi > 100) aqiStatus = "Sensitive";
else if (aqi <= 100) aqiStatus = "Good";

const html = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #d9534f;">🌫️ Air Quality Alert — Stay Safe, ${userName}!</h2>

    <p>Dear ${userName},</p>

    <p>
      We’ve detected that the air quality in <strong>${city}</strong> is currently 
      at <strong>${aqi}</strong> AQI (<strong>${aqiStatus}</strong> level), 
      which is above your preferred threshold of ${threshold}.
      Since you’re planning to go out around <strong>${scheduledAt}</strong>, 
      please take extra care.
    </p>

    <p><strong>Health-specific recommendations:</strong></p>
    <ul>
      ${conditionAdvice}
      <li>Always wear a protective mask (N95/KN95) when outdoors.</li>
      <li>Keep windows closed to reduce indoor air pollution.</li>
      <li>Check AQI updates frequently before your outings.</li>
    </ul>

    <p>
      <em>Your wellbeing is our top priority. Please stay cautious and take care of yourself during poor air conditions.</em>
    </p>

    <p>Warm regards,<br>
    <strong>CypherX Health Monitor</strong></p>
  </div>
`;



  await sendMail(user, `⚠️ AQI Alert — ${user.health?.city || "Test City"}`, html);
  console.log(`✅ Manual alert sent to ${user.email}`);
  return true;
}

/**
 * Outing scheduler management
 *
 * We'll keep an in-memory map of cron jobs for each user so we can cancel/reschedule.
 * NOTE: In-memory map is fine for single server. For horizontal scaling you'd persist schedules elsewhere.
 */
const userCronJobs = new Map(); // userId => [cronJob, cronJob, ...]

/** Helper: parse HH:MM string to {hour, minute} or null */
function parseHHMM(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return null;
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/**
 * Schedule outing alerts for a single user.
 * Cancels any existing jobs for that user first.
 *
 * - user: mongoose document or object with _id and health.outings (array of "HH:MM")
 */
export function scheduleOutingAlertsForUser(user) {
  if (!user || !user._id) {
    console.warn("scheduleOutingAlertsForUser: invalid user", user);
    return;
  }
  const userId = String(user._id);

  // Cancel any existing jobs for this user
  cancelOutingAlertsForUser(userId);

  const outings = Array.isArray(user.health?.outings) ? user.health.outings : [];
  const jobs = [];

  outings.forEach((timeStr) => {
    const parsed = parseHHMM(timeStr);
    if (!parsed) {
      console.warn(`Invalid outing time for user ${userId}:`, timeStr);
      return;
    }
    const { hour, minute } = parsed;
    // cron format: minute hour day month dayOfWeek
    const cronExpr = `${minute} ${hour} * * *`;
    const job = cron.schedule(
      cronExpr,
      async () => {
        try {
          console.log(`🔔 Running scheduled outing alert for user ${userId} at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
          // Refresh user from DB in case data changed (ensure latest email etc.)
          const freshUser = await User.findById(userId);
          if (!freshUser) {
            console.warn("User not found when running scheduled job:", userId);
            return;
          }
          await sendManualAlert(freshUser, { scheduledAt: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` });
        } catch (e) {
          console.error("Error in scheduled outing alert:", e?.message || e);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Yangon",
      }
    );
    jobs.push(job);
    console.log(`Scheduled outing for user ${userId} at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} (cron: ${cronExpr})`);
  });

  if (jobs.length) userCronJobs.set(userId, jobs);
  return jobs;
}

/** Cancel all scheduled outing jobs for a given user id */
export function cancelOutingAlertsForUser(userId) {
  if (!userId) return;
  const existing = userCronJobs.get(String(userId));
  if (!existing) return;
  existing.forEach((j) => {
    try {
      j.stop();
    } catch (e) {
      console.warn("Error stopping cron job:", e?.message || e);
    }
  });
  userCronJobs.delete(String(userId));
  console.log(`Cancelled ${existing.length} outing job(s) for user ${userId}`);
}

/**
 * Start schedules for all users on startup.
 * Scans DB for users that use email notifications and have outings.
 */
export async function startAllOutingSchedules() {
  try {
    const users = await User.find({ "health.notifyBy": "email" });
    console.log(`Scheduling outings for ${users.length} users...`);
    for (const u of users) {
      if (Array.isArray(u.health?.outings) && u.health.outings.length > 0) {
        scheduleOutingAlertsForUser(u);
      }
    }
    console.log("✅ Completed scheduling user outings.");
  } catch (e) {
    console.error("Failed to schedule user outings:", e?.message || e);
  }
}

/**
 * Optional: Start a single daily cron that sends a test alert to all email users (kept for backward compatibility)
 */
export function startDailyManualAlert(enabled = false) {
  if (!enabled) return;
  cron.schedule(
    "30 6 * * *", // 06:30 Asia/Yangon
    async () => {
      try {
        console.log("🔔 Sending daily manual alerts to all users...");
        const users = await User.find({ "health.notifyBy": "email" });
        for (const u of users) {
          await sendManualAlert(u, { scheduledAt: "06:30" });
        }
      } catch (e) {
        console.error("❌ Daily manual alert failed:", e.message);
      }
    },
    { timezone: "Asia/Yangon" }
  );
}

// Export existing API plus new scheduling functions
export default {
  sendManualAlert,
  verifyMailer,
  startDailyManualAlert,
  scheduleOutingAlertsForUser,
  cancelOutingAlertsForUser,
  startAllOutingSchedules,
};
