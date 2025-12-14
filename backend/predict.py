import pandas as pd
import pickle

# Load the saved model
with open("model.pkl", "rb") as f:
    model = pickle.load(f)

# Load CSV
df = pd.read_csv("air_data.csv")

# Get last row from CSV (latest collected data)
last = df.iloc[-1]

# Prepare input for prediction
X = [[
    last["pm25"],
    last["pm10"],
    last["no2"],
    last["o3"],
    last["co"],
    last["so2"],
    last["temp"],
    last["humidity"],
    last["wind"]
]]

# Predict tomorrow's PM2.5
prediction = model.predict(X)[0]

print("Predicted PM2.5 for tomorrow:", prediction)
