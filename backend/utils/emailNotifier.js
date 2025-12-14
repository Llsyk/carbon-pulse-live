// backend/utils/emailNotifier.js

import nodemailer from "nodemailer";
import twilio from "twilio";
import User from "../models/User.js";
import cron from "node-cron";

/* ──────────────────── EASY SEND SMS ──────────────────── */

async function sendEasySendSMS(phone, message) {
  if (!phone) {
    console.warn("⚠️ No phone number provided");
    return null;
  }

  try {
    const res = await fetch("https://my.easysendsms.app/api/send-sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EASYSENDSMS_API_KEY}`,
      },
      body: JSON.stringify({
        to: phone,
        message,
        sender: "CypherX",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "SMS API error");
    }

    console.log(`📱 SMS sent → ${phone}`);
    return data;
  } catch (err) {
    console.error("❌ EasySendSMS failed:", err.message);
    return null;
  }
}

/* ──────────────────── MAILER ──────────────────── */

function makeTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("❌ EMAIL_USER or EMAIL_PASS missing in .env");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

export async function verifyMailer() {
  try {
    const transporter = makeTransporter();
    await transporter.verify();
    console.log("✅ Gmail SMTP verified");
  } catch (err) {
    console.error("❌ Gmail verification failed:", err.message);
  }
}

/* ──────────────────── TWILIO ──────────────────── */

function makeTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    throw new Error("❌ Twilio credentials missing");
  }

  return twilio(sid, token);
}

/* ──────────────────── INTERNAL SENDERS ──────────────────── */

async function sendMail(user, subject, html) {
  if (!user?.email) {
    console.warn("⚠️ No email for user:", user?._id);
    return null;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(user.email)) {
    console.warn("⚠️ Invalid email:", user.email);
    return null;
  }

  try {
    const transporter = makeTransporter();
    const info = await transporter.sendMail({
      from: `"CypherX Health Monitor" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html,
    });

    console.log(`📧 Email sent → ${user.email}`);
    return info;
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    return null;
  }
}

async function sendSMS(user, message) {
  if (!user?.health?.phone) return null;

  try {
    const client = makeTwilioClient();
    return await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.health.phone,
    });
  } catch (err) {
    console.error("❌ SMS send failed:", err.message);
    return null;
  }
}

/* ──────────────────── MAIN ALERT ──────────────────── */

export async function sendManualAlert(user, opts = {}) {
  if (!user) return null;

  const name = user.name || "User";
  const city = user.health?.city || "your area";
  const notifyBy = user.health?.notifyBy || "email";
  const scheduledAt = opts.scheduledAt || "now";

  let aqi = Number(opts.currentAQI ?? 3);
  if (aqi < 1) aqi = 1;
  if (aqi > 5) aqi = 5;

  const aqiMap = {
    1: { label: "Good", desc: "Air quality is healthy and safe." },
    2: { label: "Fair", desc: "Minor air quality concern." },
    3: { label: "Moderate", desc: "Sensitive individuals should take care." },
    4: { label: "Poor", desc: "Health effects may occur." },
    5: { label: "Very Poor", desc: "Serious health risks for everyone." },
  };

  const aqiInfo = aqiMap[aqi];

  /* ───────────── EMAIL TEMPLATE ───────────── */

  const html = `
  <div style="font-family: Arial, sans-serif; color:#333; line-height:1.6">
    <h2 style="color:#c0392b">🌫️ Air Quality Alert — Stay Safe, ${name}!</h2>

    <p>Dear <b>${name}</b>,</p>

    <p>
      We’ve detected that the air quality in <b>${city}</b> is currently at
      <b>AQI Level ${aqi} (${aqiInfo.label})</b>.
    </p>

    <p>
      This level indicates that <b>${aqiInfo.desc}</b>
      ${aqi >= 4 ? " and extra precautions are strongly recommended." : ""}
    </p>

    <p>
      Since you’re planning to go out around <b>${scheduledAt}</b>,
      please take the following health precautions:
    </p>

    <ul>
      <li>💧 Maintain proper hydration</li>
      <li>😷 Wear a protective mask (N95 / KN95)</li>
      <li>🏠 Keep windows closed to reduce indoor pollution</li>
      <li>📱 Monitor AQI updates before heading outdoors</li>
    </ul>

    <p>
      Your wellbeing is our top priority. Please stay cautious and take care of
      yourself during poor air conditions.
    </p>

    <p>
      Warm regards,<br/>
      <b>CypherX Health Monitor</b>
    </p>
  </div>
  `;

  const sms = `🌫️ Air Quality Alert
City: ${city}
AQI: ${aqi}/5 (${aqiInfo.label})
Time: ${scheduledAt}
Please take precautions.`;

  if (notifyBy === "sms") {
    await sendSMS(user, sms);
  } else {
    await sendMail(
      user,
      `🌫️ Air Quality Alert — Stay Safe, ${name}`,
      html
    );
  }

  return true;
}

/* ──────────────────── DAILY EMAILS ──────────────────── */

export async function sendDailyPredictionEmails() {
  try {
    const users = await User.find({ "health.notifyBy": "email" });
    for (const u of users) {
      await sendManualAlert(u, { scheduledAt: "today" });
    }
  } catch (err) {
    console.error("❌ Daily prediction failed:", err.message);
  }
}

/* ──────────────────── OUTING SCHEDULER ──────────────────── */

const userCronJobs = new Map();

function parseHHMM(hhmm) {
  const m = hhmm?.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return { hour: +m[1], minute: +m[2] };
}

export function scheduleOutingAlertsForUser(user) {
  if (!user?._id) return;

  cancelOutingAlertsForUser(user._id);

  const outings = user.health?.outings || [];
  const jobs = [];

  outings.forEach((time) => {
    const t = parseHHMM(time);
    if (!t) return;

    const job = cron.schedule(
      `${t.minute} ${t.hour} * * *`,
      async () => {
        const freshUser = await User.findById(user._id);
        if (freshUser) {
          await sendManualAlert(freshUser, { scheduledAt: time });
        }
      },
      { timezone: "Asia/Yangon" }
    );

    jobs.push(job);
  });

  if (jobs.length) userCronJobs.set(String(user._id), jobs);
}

export function cancelOutingAlertsForUser(userId) {
  const jobs = userCronJobs.get(String(userId));
  if (!jobs) return;
  jobs.forEach((j) => j.stop());
  userCronJobs.delete(String(userId));
}

export async function startAllOutingSchedules() {
  const users = await User.find({ "health.outings.0": { $exists: true } });
  users.forEach(scheduleOutingAlertsForUser);
}

/* ──────────────────── 1-HOUR-BEFORE OUTING ALERT ──────────────────── */

const preOutingJobs = new Map();

function minusOneHour({ hour, minute }) {
  let h = hour - 1;
  if (h < 0) h = 23;
  return { hour: h, minute };
}

export function schedulePreOutingAlert(user) {
  if (!user?._id) return;

  cancelPreOutingAlert(user._id);

  const timeStr = user.health?.usualOutingTime;
  const parsed = parseHHMM(timeStr);
  if (!parsed) return;

  const notifyTime = minusOneHour(parsed);

  const job = cron.schedule(
    `${notifyTime.minute} ${notifyTime.hour} * * *`,
    async () => {
      const freshUser = await User.findById(user._id);
      if (freshUser) {
        await sendManualAlert(freshUser, {
          scheduledAt: `around ${timeStr}`,
        });
      }
    },
    { timezone: "Asia/Yangon" }
  );

  preOutingJobs.set(String(user._id), job);
}

export function cancelPreOutingAlert(userId) {
  const job = preOutingJobs.get(String(userId));
  if (job) job.stop();
  preOutingJobs.delete(String(userId));
}

export async function startAllPreOutingAlerts() {
  const users = await User.find({ "health.usualOutingTime": { $exists: true } });
  users.forEach(schedulePreOutingAlert);
}

/* ──────────────────── OPTIONAL DAILY TEST ──────────────────── */

export function startDailyManualAlert(enabled = false) {
  if (!enabled) return;

  cron.schedule(
    "30 6 * * *",
    async () => {
      const users = await User.find({ "health.notifyBy": "email" });
      for (const u of users) {
        await sendManualAlert(u, { scheduledAt: "06:30" });
      }
    },
    { timezone: "Asia/Yangon" }
  );
}

/* ──────────────────── EXPORT ──────────────────── */

export default {
  sendManualAlert,
  sendDailyPredictionEmails,
  verifyMailer,
  startDailyManualAlert,
  scheduleOutingAlertsForUser,
  cancelOutingAlertsForUser,
  startAllOutingSchedules,
  schedulePreOutingAlert,
  cancelPreOutingAlert,
  startAllPreOutingAlerts,
};
