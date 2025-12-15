import os
import pandas as pd
from pymongo import MongoClient
from sklearn.linear_model import LinearRegression
import yagmail
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# -------------------- MongoDB Setup --------------------
MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = "airpollution"
USER_COLLECTION = "users"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users_col = db[USER_COLLECTION]

# -------------------- Email Setup --------------------
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
SENDER_NAME = "Ecobreath"  # Sender display name

yag = yagmail.SMTP(user=EMAIL_USER, password=EMAIL_PASS)

# -------------------- Load and Train Model --------------------
df = pd.read_csv("air_data.csv")  # Make sure your CSV is updated

feature_cols = ["pm25", "pm10", "no2", "o3", "co", "so2", "temp", "humidity", "wind_speed"]
target_col = "aqi"

X = df[feature_cols]
y = df[target_col]

model = LinearRegression()
model.fit(X, y)

# -------------------- Predict AQI for Tomorrow --------------------
last_row = df.iloc[-1]
X_tomorrow = pd.DataFrame([[
    last_row["pm25"], last_row["pm10"], last_row["no2"], last_row["o3"],
    last_row["co"], last_row["so2"], last_row["temp"], last_row["humidity"], last_row["wind_speed"]
]], columns=feature_cols)

predicted_aqi = int(model.predict(X_tomorrow)[0])

# -------------------- Determine AQI Level --------------------
def get_aqi_level(aqi):
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Moderate"
    elif aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    elif aqi <= 200:
        return "Unhealthy"
    elif aqi <= 300:
        return "Very Unhealthy"
    else:
        return "Hazardous"

aqi_level = get_aqi_level(predicted_aqi)

# -------------------- Compose Email --------------------
def compose_email(user_name, city, predicted_aqi, aqi_level):
    return f"""
Air Quality Alert — Stay Safe, {user_name}!

Dear {user_name},

We’ve detected that the air quality in {city} is currently at AQI Level {predicted_aqi} ({aqi_level}).

This level indicates that sensitive individuals should take care.

Since you’re planning to go out around tomorrow morning, please take the following health precautions:

    💧 Maintain proper hydration
    😷 Wear a protective mask (N95 / KN95)
    🏠 Keep windows closed to reduce indoor pollution
    📱 Monitor AQI updates before heading outdoors

Your wellbeing is our top priority. Please stay cautious and take care of yourself during poor air conditions.

Warm regards,
Ecobreath
"""

# -------------------- Send Email Only if AQI is Bad --------------------
# if predicted_aqi > 100:  # Only for Unhealthy or worse
users = users_col.find({"health.notifyBy": "email"})
for user in users:
    name = user.get("name", "User")
    city = user.get("health", {}).get("city", "your city")
    email = user.get("email")

    body = compose_email(name, city, predicted_aqi, aqi_level)

    try:
        yag.send(
            to=email,
            subject=f"Air Quality Alert — AQI {predicted_aqi}",
            contents=body,
            headers={"From": f"{SENDER_NAME} <{EMAIL_USER}>"}
        )
        print(f"Email sent to {name} ({email})")
    except Exception as e:
        print(f"Failed to send email to {email}: {e}")
# else:
#     print(f"AQI {predicted_aqi} ({aqi_level}) is Good/Moderate. No emails sent.")
