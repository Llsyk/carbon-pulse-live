from flask import Flask, jsonify
from flask_cors import CORS      # ⬅️ add this
import requests

app = Flask(__name__)
CORS(app)  # ⬅️ enable CORS for all routes (good enough for development)

API_KEY = "6e6f9659fef62e5c5d1103979100d281"  # your key

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

if __name__ == "__main__":
    app.run(port=5000, debug=True)
