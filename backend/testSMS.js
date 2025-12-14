import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import fs from "fs";
import csv from "csv-parser";

dotenv.config();

// --- Read CSV and calculate average AQI for each hour ---
async function loadAQIData(csvPath = "./air_data.csv") {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", () => {
        if (results.length === 0) return resolve({});
        const hourlyAQI = {}; // { "HH:MM": [aqiValues] }

        results.forEach((row) => {
          const time = row.timestamp.split(" ")[1].slice(0, 5); // "HH:MM"
          if (!hourlyAQI[time]) hourlyAQI[time] = [];
          hourlyAQI[time].push(parseFloat(row.aqi));
        });

        // Calculate average AQI for each time
        const avgHourlyAQI = {};
        for (const time in hourlyAQI) {
          const values = hourlyAQI[time];
          avgHourlyAQI[time] =
            values.reduce((a, b) => a + b, 0) / values.length;
        }

        resolve(avgHourlyAQI);
      })
      .on("error", (err) => reject(err));
  });
}

// --- Convert AQI to level ---
function aqiLevel(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

// --- Main function ---
async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("airpollution");
    const users = await db.collection("users").find({}).toArray();

    // Filter users who want SMS notifications
    const smsUsers = users.filter(u => u.health?.notifyBy === "sms");

    if (!smsUsers.length) {
      console.log("No SMS users found.");
      return;
    }

    const hourlyAQI = await loadAQIData();

    for (const user of smsUsers) {
      const outings = user.health?.outings || [];
      if (!outings.length) continue;

      for (const outingTime of outings) {
        // Predict AQI using today’s average for that time
        const predictedAQI = hourlyAQI[outingTime] ?? "No data";
        const level =
          typeof predictedAQI === "number" ? aqiLevel(predictedAQI) : "Unknown";

        const message = `📨 [TEST SMS] 
Hello ${user.name},
Your outing time: ${outingTime} (tomorrow)
Predicted AQI: ${predictedAQI} (${level})

This is a test message.`;

        console.log(message);
        console.log("-----------------------------");
      }
    }
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

main();
