from flask import Flask, jsonify
from flask_cors import CORS
import requests
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
CORS(app)

API_KEY = "6e6f9659fef62e5c5d1103979100d281"


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


@app.route("/api/air/<lat>/<lon>")
def air(lat, lon):
    result = get_air_quality(lat, lon)
    if result is None:
        return jsonify({"error": "API failed"}), 500
    return jsonify(result)


# -----------------------------------------------------------
# NEW: 5-DAY HISTORICAL AIR POLLUTION API
# -----------------------------------------------------------
@app.route("/api/air/history5days/<lat>/<lon>")
def history5days(lat, lon):
    # time range: now → 5 days ago
    end = int(datetime.now(timezone.utc).timestamp())
    start = int((datetime.now(timezone.utc) - timedelta(days=5)).timestamp())

    url = (
        f"http://api.openweathermap.org/data/2.5/air_pollution/history?"
        f"lat={lat}&lon={lon}&start={start}&end={end}&appid={API_KEY}"
    )

    res = requests.get(url)
    if res.status_code != 200:
        return jsonify({"error": "Historical API failed"}), 500

    raw = res.json().get("list", [])

    # --- group by day (YYYY-MM-DD)
    daily = {}

    for entry in raw:
        ts = entry["dt"]
        date = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
        comp = entry["components"]

        if date not in daily:
            daily[date] = {
                "count": 0,
                "pm25": 0,
                "pm10": 0,
                "no2": 0,
                "o3": 0,
                "co": 0,
                "so2": 0
            }

        daily[date]["count"] += 1
        daily[date]["pm25"] += comp["pm2_5"]
        daily[date]["pm10"] += comp["pm10"]
        daily[date]["no2"] += comp["no2"]
        daily[date]["o3"] += comp["o3"]
        daily[date]["co"] += comp["co"]
        daily[date]["so2"] += comp["so2"]

    # --- convert to daily averages
    output = []
    for date, values in sorted(daily.items()):
        c = values["count"]
        output.append({
            "date": date,
            "pm25": values["pm25"] / c,
            "pm10": values["pm10"] / c,
            "no2": values["no2"] / c,
            "o3": values["o3"] / c,
            "co": values["co"] / c,
            "so2": values["so2"] / c
        })

    return jsonify(output)


# -----------------------------------------------------------
# ASEAN + Monthly ENDPOINTS (unchanged)
# -----------------------------------------------------------
ASEAN_COUNTRIES = {
    "MM": { "name": "Myanmar",       "lat": 16.8409,  "lon": 96.1735  },  # Yangon
    "TH": { "name": "Thailand",      "lat": 13.7563,  "lon": 100.5018 },  # Bangkok
    "VN": { "name": "Vietnam",       "lat": 21.0278,  "lon": 105.8342 },  # Hanoi
    "SG": { "name": "Singapore",     "lat": 1.3521,   "lon": 103.8198 },  # Singapore
    "MY": { "name": "Malaysia",      "lat": 3.1390,   "lon": 101.6869 },  # Kuala Lumpur
    "ID": { "name": "Indonesia",     "lat": -6.2088,  "lon": 106.8456 }, # Jakarta
    "PH": { "name": "Philippines",   "lat": 14.5995,  "lon": 120.9842 }, # Manila
    "BN": { "name": "Brunei",        "lat": 4.9031,   "lon": 114.9398 }, # Bandar Seri Begawan
    "KH": { "name": "Cambodia",      "lat": 11.5564,  "lon": 104.9282 }, # Phnom Penh
    "LA": { "name": "Laos",          "lat": 17.9757,  "lon": 102.6331 }, # Vientiane
    "TL": { "name": "Timor-Leste",   "lat": -8.5569,  "lon": 125.5603 }, # Dili
}

@app.route("/api/air/asean")
def asean_air():
    results = []

    for code, info in ASEAN_COUNTRIES.items():
        air = get_air_quality(info["lat"], info["lon"])
        if air:
            results.append({"country": code, "country_name": info["name"], **air})

    if not results:
        return jsonify({"error": "Failed to load ASEAN data"}), 500

    return jsonify(results)


@app.route("/api/air/monthly/<lat>/<lon>")
def monthly(lat, lon):
    live = get_air_quality(lat, lon)
    if live is None:
        return jsonify({"error": "API failed"}), 500

    base = live
    scale = [0.82, 0.88, 0.93, 0.97, 1.0, 1.05, 1.08, 1.12, 1.1, 1.03, 0.95, 0.9]

    monthly_data = []
    for i in range(12):
        monthly_data.append({
            "month": i + 1,
            "pm25": base["pm25"] * scale[i],
            "pm10": base["pm10"] * scale[i],
            "co": base["co"] * scale[i],
            "no2": base["no2"] * scale[i],
            "o3": base["o3"] * scale[i],
        })

    return jsonify(monthly_data)

@app.route("/api/air/history/<lat>/<lon>")
def history(lat, lon):
    now = int(datetime.now(timezone.utc).timestamp())
    one_day = 86400

    results = []

    # Fetch last 5 days from OpenWeather History API
    for i in range(5):
        ts = now - (i * one_day)

        url = (
            f"http://api.openweathermap.org/data/2.5/air_pollution/history?"
            f"lat={lat}&lon={lon}&start={ts - one_day}&end={ts}&appid={API_KEY}"
        )

        response = requests.get(url)
        if response.status_code != 200:
            continue

        data = response.json().get("list", [])
        if not data:
            continue

        # Last reading of the day
        last = data[-1]

        comp = last["components"]

        results.append({
            "timestamp": last["dt"],
            "pm25": comp["pm2_5"],
            "pm10": comp["pm10"],
            "no2": comp["no2"],
            "o3": comp["o3"],
            "co": comp["co"],
            "so2": comp["so2"]
        })

    # Reverse to oldest → newest
    results.reverse()

    return jsonify(results)

if __name__ == "__main__":
    app.run(port=5000, debug=True)
