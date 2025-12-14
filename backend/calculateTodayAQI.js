import fs from "fs";
import csv from "csv-parser";

const CSV_PATH = "./air_data.csv";

const dailyAQI = {};

fs.createReadStream(CSV_PATH)
  .pipe(csv())
  .on("data", (row) => {
    const date = row.timestamp.split(" ")[0]; // extract date
    const aqi = parseFloat(row.aqi);

    if (!dailyAQI[date]) dailyAQI[date] = [];
    dailyAQI[date].push(aqi);
  })
  .on("end", () => {
    const dates = Object.keys(dailyAQI).sort();
    const today = dates[dates.length - 1]; // most recent day
    const todayAQIs = dailyAQI[today];

    const avgAQI =
      todayAQIs.reduce((sum, val) => sum + val, 0) / todayAQIs.length;

    console.log(`📌 Today: ${today}`);
    console.log(`📊 Average AQI today: ${avgAQI.toFixed(2)}`);
  });
