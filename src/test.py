import requests
from requests.adapters import HTTPAdapter, Retry

API_TOKEN = "80ac8d9e0c3933656ba8c50947297d5cbc7f8b54"  # rotate if leaked
CITY = "Bangkok"
# Optional: precise coords for Bangkok (fallback route)
LAT, LON = 13.7563, 100.5018

BASE = "https://api.waqi.info"
CITY_URL = f"{BASE}/feed/{CITY}/?token={API_TOKEN}"
GEO_URL  = f"{BASE}/feed/geo:{LAT};{LON}/?token={API_TOKEN}"

def make_session():
    s = requests.Session()
    retries = Retry(
        total=5,
        connect=5,
        read=5,
        backoff_factor=0.8,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"]
    )
    adapter = HTTPAdapter(max_retries=retries, pool_connections=10, pool_maxsize=10)
    s.mount("https://", adapter)
    s.mount("http://", adapter)
    return s

def fetch(url):
    # (connect timeout, read timeout) in seconds
    return session.get(url, timeout=(5, 15))

session = make_session()

def parse_and_print(data, label=""):
    if data.get("status") != "ok":
        print(f"⚠️ WAQI returned status={data.get('status')} for {label}")
        return False
    aqi = data["data"]["aqi"]
    iaqi = data["data"].get("iaqi", {})
    ts = data["data"]["time"]["s"]
    pollutants = {
        "PM2.5": iaqi.get("pm25", {}).get("v", "N/A"),
        "PM10": iaqi.get("pm10", {}).get("v", "N/A"),
        "NO2":  iaqi.get("no2",  {}).get("v", "N/A"),
        "O3":   iaqi.get("o3",   {}).get("v", "N/A"),
        "CO":   iaqi.get("co",   {}).get("v", "N/A"),
        "SO2":  iaqi.get("so2",  {}).get("v", "N/A"),
    }
    print(f"🌆 {label} | AQI: {aqi} | Last Updated: {ts}")
    for p, v in pollutants.items():
        print(f"{p}: {v}")
    return True

try:
    # 1) Try city endpoint
    r = fetch(CITY_URL)
    if not parse_and_print(r.json(), f"{CITY} (city)"):
        # 2) Fallback to geo endpoint if city returns not ok
        rg = fetch(GEO_URL)
        parse_and_print(rg.json(), f"{CITY} ({LAT},{LON})")

except requests.exceptions.ConnectTimeout:
    print("⛔ Connect timeout: could not reach api.waqi.info (port 443). "
          "Check VPN/proxy/firewall or try another network.")
except requests.exceptions.ReadTimeout:
    print("⏳ Read timeout: server accepted the connection but didn’t respond in time.")
except requests.exceptions.SSLError as e:
    print(f"🔒 SSL error: {e}. Ensure system time/certs are correct (Windows cert store).")
except requests.exceptions.ProxyError as e:
    print(f"🧭 Proxy error: {e}. Verify HTTPS_PROXY/HTTP_PROXY and credentials.")
except requests.exceptions.RequestException as e:
    print(f"❗ Request failed: {e}")
