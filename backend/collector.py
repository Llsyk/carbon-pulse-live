import requests
import csv
from datetime import datetime

API_KEY = "6e6f9659fef62e5c5d1103979100d281"      # <-- Put your OpenWeather key here
LAT = 16.8                # <-- Your latitude
LON = 96.2                # <-- Your longitude

def collect():
    # Air Quality
    air_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={LAT}&lon={LON}&appid={API_KEY}"
    air = requests.get(air_url).json()["list"][0]

    comp = air["components"]

    # Weather
    weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={LAT}&lon={LON}&appid={API_KEY}&units=metric"
    weather = requests.get(weather_url).json()

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    row = [
        timestamp,
        air["main"]["aqi"],
        comp["pm2_5"],
        comp["pm10"],
        comp["no2"],
        comp["o3"],
        comp["co"],
        comp["so2"],
        weather["main"]["temp"],
        weather["main"]["humidity"],
        weather["wind"]["speed"]
    ]

    with open("air_data.csv", "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(row)

    print("Saved:", row)

collect()
