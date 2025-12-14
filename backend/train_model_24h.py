# train_model_24h.py
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib

# config
CSV = "air_data.csv"
MODEL_FILE = "model_24h.pkl"
LAG_HOURS = 0  # we will use current row to predict 24h ahead

# load data
df = pd.read_csv(CSV, parse_dates=["timestamp"])

# ensure sorted by time
df = df.sort_values("timestamp").reset_index(drop=True)

# features we will use from time t to predict pm25 at t+24h
features = ["pm25","pm10","no2","o3","co","so2","temp","humidity","wind"]

# create target: pm25 24 hours ahead (assuming hourly data)
df["target_pm25"] = df["pm25"].shift(-24)  # value 24 rows later

# drop rows that don't have a target
df_model = df.dropna(subset=["target_pm25"]).copy()

X = df_model[features]
y = df_model["target_pm25"]

# split & train
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestRegressor(n_estimators=200, random_state=42)
model.fit(X_train, y_train)

# evaluate
pred = model.predict(X_test)
mae = mean_absolute_error(y_test, pred)
print(f"MAE on test set: {mae:.2f} µg/m³")

# save model
joblib.dump({"model": model, "features": features}, MODEL_FILE)
print("Saved model to", MODEL_FILE)
