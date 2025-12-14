from flask import Flask, jsonify
from flask_cors import CORS
import requests
from datetime import datetime, timedelta, timezone
import pickle
import pandas as pd

app = Flask(__name__)
CORS(app)

API_KEY = "6e6f9659fef62e5c5d1103979100d281"

# Load the saved model
with open("model.pkl", "rb") as f:
    model = pickle.load(f)


# -----------------------------------
# EXISTING FUNCTION
# -----------------------------------
def get_air_quality(lat, lon):
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={API_KEY}"
    response = requests.get(url)

    if response.status_code != 200:
        return None

    data = response.json()["list"][0]
    comp = data["components"]

    return {
        "aqi": data["main"]["aqi"],
        "pm25": comp["pm2_5"],
        "pm10": comp["pm10"],
        "no2": comp["no2"],
        "o3": comp["o3"],
        "co": comp["co"],
        "so2": comp["so2"]
    }


def get_weather(lat, lon):
    url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    response = requests.get(url)

    if response.status_code != 200:
        return None

    data = response.json()
    return {
        "temp": data["main"]["temp"],
        "humidity": data["main"]["humidity"],
        "wind": data["wind"]["speed"]
    }


def predict_air_quality(lat, lon):
    air = get_air_quality(lat, lon)
    weather = get_weather(lat, lon)
    if air is None or weather is None:
        return None

    X = [[
        air["pm25"],
        air["pm10"],
        air["no2"],
        air["o3"],
        air["co"],
        air["so2"],
        weather["temp"],
        weather["humidity"],
        weather["wind"]
    ]]

    prediction = model.predict(X)[0]
    return {
        "predicted_pm25": prediction,
        "current_aqi": air["aqi"]
    }


@app.route("/api/air/<lat>/<lon>")
def air(lat, lon):
    result = get_air_quality(lat, lon)
    if result is None:
        return jsonify({"error": "API failed"}), 500
    return jsonify(result)


@app.route("/api/predict/<lat>/<lon>")
def predict(lat, lon):
    result = predict_air_quality(lat, lon)
    if result is None:
        return jsonify({"error": "Prediction failed"}), 500
    return jsonify(result)

if __name__ == "__main__":
    app.run(port=5000, debug=True)
