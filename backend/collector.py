import requests
import csv
import os
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

# =========================
# Configuration
# =========================
load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
MONGO_URI = os.getenv("MONGODB_URI")  # <-- Must match your .env
DB_NAME = "airpollution"              # MongoDB database name
USER_COLLECTION = "users"             # MongoDB collection name

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, "air_data.csv")

# =========================
# MongoDB Connection
# =========================
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]
    users_col = db[USER_COLLECTION]
    # Test connection
    client.server_info()
    print("🔌 MongoDB connected successfully")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    exit(1)

# =========================
# Helper Functions
# =========================
def fetch_air_quality(lat, lon):
    """Fetch air pollution data from OpenWeather."""
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}"
    res = requests.get(url, timeout=10)
    res.raise_for_status()
    return res.json()["list"][0]

def fetch_weather(lat, lon):
    """Fetch weather data from OpenWeather."""
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
    res = requests.get(url, timeout=10)
    res.raise_for_status()
    return res.json()

def write_csv_header_if_needed():
    """Create CSV with header if it doesn't exist."""
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "timestamp",
                "user_id",
                "email",
                "lat",
                "lon",
                "aqi",
                "pm25",
                "pm10",
                "no2",
                "o3",
                "co",
                "so2",
                "temp",
                "humidity",
                "wind_speed"
            ])

# =========================
# Main Collector
# =========================
def collect():
    if not OPENWEATHER_API_KEY:
        raise RuntimeError("❌ OPENWEATHER_API_KEY not set")

    write_csv_header_if_needed()

    # ✅ Correct query using schema: health.lat & health.lng
    users = list(users_col.find({"health.lat": {"$exists": True}, "health.lng": {"$exists": True}}))
    print(f"👥 Total users found: {len(users)}")

    if not users:
        print("⚠️ No users with valid location found. Exiting...")
        return

    for user in users:
        try:
            health = user.get("health", {})
            lat = health.get("lat")
            lon = health.get("lng")

            if lat is None or lon is None:
                print(f"⚠️ Skipping user {user.get('_id')} due to missing lat/lng")
                continue

            air = fetch_air_quality(lat, lon)
            weather = fetch_weather(lat, lon)

            comp = air["components"]
            timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

            row = [
                timestamp,
                str(user["_id"]),
                user.get("email", ""),
                lat,
                lon,
                air["main"]["aqi"],
                comp.get("pm2_5"),
                comp.get("pm10"),
                comp.get("no2"),
                comp.get("o3"),
                comp.get("co"),
                comp.get("so2"),
                weather["main"]["temp"],
                weather["main"]["humidity"],
                weather["wind"]["speed"],
            ]

            with open(CSV_FILE, "a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(row)

            print(f"✅ Saved AQI data for {user.get('email')}")

        except requests.exceptions.RequestException as e:
            print(f"❌ Network/API error for user {user.get('_id')}: {e}")
        except Exception as e:
            print(f"❌ Failed for user {user.get('_id')}: {e}")

# =========================
# Run Collector
# =========================
if __name__ == "__main__":
    print("🔑 API KEY LOADED:", bool(OPENWEATHER_API_KEY))
    print("📁 CSV FILE PATH:", CSV_FILE)
    collect()
