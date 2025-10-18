// // backend/utils/aqiNotifier.js
// import fetch from "node-fetch";
// import User from "../models/User.js";
// import { checkAndSendOutingAlertForUser } from "./emailNotifier.js";


// const API_KEY = process.env.AQI_API_KEY;

// /**
//  * Check AQI for each user and send notification if tomorrow's AQI exceeds threshold.
//  * This can be scheduled with a cron job or manual test endpoint.
//  */
// export async function checkAndNotifyAQI() {
//   console.log("🔍 Running AQI check for all users...");

//   const users = await User.find({ "health.notifyBy": "email" });
//   if (!users.length) {
//     console.log("No users with email notifications.");
//     return;
//   }

//   for (const user of users) {
//     const city = user.health?.city;
//     if (!city) continue;

//     try {
//       const url = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${API_KEY}`;
//       const res = await fetch(url);
//       const data = await res.json();

//       if (!data || data.status !== "ok") {
//         console.warn(`⚠️ AQI fetch failed for ${city}:`, data?.data);
//         continue;
//       }

//       // Get tomorrow's (or latest) AQI value
//       const aqi = data.data.aqi;
//       const threshold = user.health.aqiThreshold;
//       const outings = user.health.outings || [];

//       if (aqi > threshold && outings.length > 0) {
//         console.log(`🚨 ${user.email}: AQI ${aqi} > ${threshold}`);

//         // Choose all outing times as risky (or add logic to check forecast per time)
//         const riskyTimes = outings;

//         await checkAndSendOutingAlertForUser(user);

//       } else {
//         console.log(`✅ ${city} AQI ${aqi} within safe limit for ${user.email}`);
//       }
//     } catch (e) {
//       console.error(`Error checking AQI for ${user.email}:`, e.message);
//     }
//   }

//   console.log("✅ AQI check complete.");
// }
