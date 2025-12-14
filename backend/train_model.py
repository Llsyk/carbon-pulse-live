import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import pickle

# Load the data
df = pd.read_csv("air_data.csv")

# Feature columns (input)
X = df[["pm25", "pm10", "no2", "o3", "co", "so2", "temp", "humidity", "wind"]]

# What we want to predict (target)
y = df["pm25"]     # Predict tomorrow PM2.5 (you can change to AQI)

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train the model
model = RandomForestRegressor()
model.fit(X_train, y_train)

# Save model
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model trained and saved as model.pkl")
