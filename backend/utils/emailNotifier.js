// // backend/utils/emailNotifier.js
// import nodemailer from "nodemailer";
// import axios from "axios";
// import User from "../models/User.js";
// import cron from "node-cron";

// /**
//  * 🔧 Create a Gmail transporter dynamically (lazy init)
//  * Ensures .env variables are read at runtime even if this module loads early
//  */
// function makeTransporter() {
//   const user = process.env.EMAIL_USER;
//   const pass = process.env.EMAIL_PASS;
//   if (!user || !pass) throw new Error("Missing EMAIL_USER or EMAIL_PASS in .env");
//   return nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 465,
//     secure: true,
//     auth: { user, pass },
//   });
// }

// /** ✅ Verify mailer connectivity */
// export async function verifyMailer() {
//   try {
//     const transporter = makeTransporter();
//     await transporter.verify();
//     console.log("✅ Mailer ready (Gmail SMTP)");
//   } catch (err) {
//     console.error("Mailer verify failed:", err.message);
//   }
// }

// /**
//  * 📊 Fetch hourly AQI forecast for tomorrow from WAQI API
//  * Returns array: [{ hour: "07:00", aqi: 110 }, ...]
//  */
// export async function fetchHourlyForecastForTomorrow(city) {
//   const token = process.env.AQI_API_KEY;
//   if (!token) {
//     console.warn("⚠️ AQI_API_KEY not set; cannot fetch forecast");
//     return [];
//   }

//   try {
//     const res = await axios.get(
//       `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${token}`
//     );
//     const data = res.data?.data;
//     if (!data) return [];

//     // Many WAQI feeds include forecast.hourly.pm25[]
//     const hourlyPM25 = data.forecast?.hourly?.pm25 || [];
//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     const yyyy = tomorrow.toISOString().slice(0, 10);

//     // Simplify structure
//     const hours = hourlyPM25
//       .filter((h) => (h.day || "").startsWith(yyyy))
//       .map((h) => ({
//         hour: h.hour.slice(0, 5),
//         aqi: h.avg,
//       }));

//     return hours;
//   } catch (err) {
//     console.error(
//       "❌ fetchHourlyForecastForTomorrow error:",
//       err?.response?.data || err.message
//     );
//     return [];
//   }
// }

// /** 🕐 Helper: match outing time ("07:30") with forecast hour ("07:00") */
// function timeMatchesForecast(outTime, forecastHour) {
//   const outHour = outTime.slice(0, 2);
//   const fHour = forecastHour.slice(0, 2);
//   return outHour === fHour;
// }

// /** ✉️ Internal: Send email to a user */
// async function sendMail(user, subject, html) {
//   const transporter = makeTransporter();
//   const mailOptions = {
//     from: `"CypherX AQI" <${process.env.EMAIL_USER}>`,
//     to: user.email,
//     subject,
//     html,
//   };
//   const info = await transporter.sendMail(mailOptions);
//   console.log(`📧 Sent to ${user.email} — messageId: ${info.messageId}`);
//   return info;
// }

// /**
//  * 🧠 Main function: checkAndSendOutingAlertForUser(user)
//  * - Gets tomorrow’s hourly AQI forecast
//  * - Compares with user.outings
//  * - Sends email if any outing exceeds threshold
//  */
// export async function checkAndSendOutingAlertForUser(user) {
//   if (!user?.health) return null;
//   if (user.health.notifyBy !== "email") return null;
//   if (!user.health.city || !user.health.outings?.length) return null;

//   const threshold = Number(user.health.aqiThreshold ?? 100);
//   const forecast = await fetchHourlyForecastForTomorrow(user.health.city);
//   if (!forecast.length) return null;

//   const tomorrow = new Date();
//   tomorrow.setDate(tomorrow.getDate() + 1);
//   const yyyy = tomorrow.toISOString().slice(0, 10);

//   // Use plain object to store last notified times
//   user.health.lastNotified = user.health.lastNotified || {};
//   const alreadyNotified = new Set(user.health.lastNotified[yyyy] || []);

//   const riskyMatches = [];
//   for (const outTime of user.health.outings) {
//     for (const f of forecast) {
//       if (timeMatchesForecast(outTime, f.hour) && Number(f.aqi) > threshold) {
//         if (!alreadyNotified.has(outTime)) {
//           riskyMatches.push({ outing: outTime, hour: f.hour, aqi: f.aqi });
//         }
//       }
//     }
//   }

//   if (!riskyMatches.length) return null;

//   // Format email with AQI category colors
//   const html = `
//     <h2>🌫️ Air Quality Alert</h2>
//     <p>Hi ${user.name},</p>
//     <p>Tomorrow (${yyyy}) in <strong>${user.health.city}</strong>, AQI is forecasted to exceed your threshold of <strong>${threshold}</strong> during these times:</p>
//     <ul>
//       ${riskyMatches
//         .map(
//           (r) => `
//         <li><b>${r.outing}</b> (${r.hour}) — AQI <b style="color:${
//             r.aqi > 200
//               ? "red"
//               : r.aqi > 150
//               ? "orangered"
//               : r.aqi > 100
//               ? "orange"
//               : "green"
//           }">${r.aqi}</b></li>
//       `
//         )
//         .join("")}
//     </ul>
//     <p>Please consider limiting outdoor activities or wearing a mask.</p>
//     <p>— CypherX</p>
//   `;

//   await sendMail(
//     user,
//     `⚠️ AQI Alert for ${user.health.city} — ${yyyy}`,
//     html
//   );

//   // Update notified list
//   user.health.lastNotified[yyyy] = Array.from(
//     new Set([...alreadyNotified, ...riskyMatches.map((r) => r.outing)])
//   );
//   await user.save();

//   return riskyMatches;
// }

// /**
//  * ⏰ Cron: runs every morning 06:30
//  * - Checks all users with email notifications
//  * - Sends alerts automatically
//  */
// export function startDailyOutingChecker(enabled = true) {
//   if (!enabled) return;
//   cron.schedule("30 6 * * *", async () => {
//     try {
//       console.log("🔔 Running daily AQI outing checks...");
//       const users = await User.find({ "health.notifyBy": "email" });
//       for (const u of users) {
//         const matches = await checkAndSendOutingAlertForUser(u);
//         if (matches?.length) {
//           console.log(`📨 Notified ${u.email} (${u.health.city})`, matches);
//         }
//       }
//     } catch (e) {
//       console.error("❌ Daily outing checker failed:", e.message);
//     }
//   });
// }

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
  // ✅ Check if email exists
  if (!user?.email) {
    console.warn("⚠️ No email found for this user:", user?._id || "unknown user");
    return null; // Stop execution if no email
  }

  // Optional: basic email format validation
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
export async function sendManualAlert(user) {
  if (!user?.email) {
    console.warn("⚠️ No email found for this user:", user?._id || "unknown user");
    return null;
  }

  console.log("✅ User email exists:", user.email); // <-- THIS WILL LOG EMAIL

  const html = `
    <h2>🌫️ Test Air Quality Alert</h2>
    <p>Hi ${user.name || "User"},</p>
    <p>This is a manual/test alert email to verify notifications work.</p>
    <ul>
      <li>Time: 07:00</li>
      <li>City: ${user.health?.city || "Test City"}</li>
      <li>Manual AQI: 150 (for testing)</li>
    </ul>
    <p>— CypherX</p>
  `;

  await sendMail(user, `⚠️ Test AQI Alert — ${user.health?.city || "Test City"}`, html);
  console.log(`✅ Manual alert sent to ${user.email}`);
  return true;
}


/**
 * ⏰ Optional: cron to send test email to all email users
 */
export function startDailyManualAlert(enabled = false) {
  if (!enabled) return;
  cron.schedule("30 6 * * *", async () => {
    try {
      console.log("🔔 Sending manual alerts to all users...");
      const users = await User.find({ "health.notifyBy": "email" });
      for (const u of users) {
        await sendManualAlert(u);
      }
    } catch (e) {
      console.error("❌ Daily manual alert failed:", e.message);
    }
  });
}
