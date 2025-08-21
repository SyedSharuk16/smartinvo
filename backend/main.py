from fastapi import FastAPI, Query
from pydantic import BaseModel
from datetime import datetime
import pandas as pd
import joblib
from backend.weather import get_weather
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from rapidfuzz import process, fuzz
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.pipeline import Pipeline

load_dotenv()

app = FastAPI()
__all__ = ["app"]

# Determine allowed CORS origins. Always allow the local frontend during development,
# and optionally include a deployed frontend URL via environment variable.
frontend_origin = os.getenv("FRONTEND_URL", "").rstrip("/")
origins = ["http://localhost:3000"]
if frontend_origin:
    origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SPOILAGE_HISTORY = []

# Loading the ML model from ML folder
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml", "spoilage_model.pkl")
model = joblib.load(MODEL_PATH)

# Load global wastage data once
WASTAGE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml", "Wastage.csv")
WASTAGE_DF = pd.read_csv(WASTAGE_PATH)

# Train a regression model to estimate global food waste
def train_global_model():
    df = WASTAGE_DF.copy()
    df["loss_percentage"] = pd.to_numeric(df["loss_percentage"], errors="coerce")
    df = df.dropna(subset=["loss_percentage", "commodity", "activity", "food_supply_stage"])
    # Use the full dataset (~23k rows) for a more accurate model
    features = ["commodity", "activity", "food_supply_stage"]
    X = df[features]
    y = df["loss_percentage"]
    pre = ColumnTransformer([("cat", OneHotEncoder(handle_unknown="ignore"), features)])
    model = GradientBoostingRegressor(random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipe = Pipeline(steps=[("pre", pre), ("model", model)])
    pipe.fit(X_train, y_train)
    preds = pipe.predict(X_test)
    accuracy = r2_score(y_test, preds)
    all_preds = pipe.predict(X)
    df["predicted_loss"] = all_preds
    top = (
        df.groupby("commodity")["predicted_loss"]
        .mean()
        .sort_values(ascending=False)
        .head(5)
        .reset_index()
    )
    return pipe, accuracy, top

GLOBAL_PIPE, GLOBAL_ACCURACY, GLOBAL_TOP = train_global_model()
GLOBAL_MODEL_INFO = {
    "model": "GradientBoostingRegressor",
    "accuracy": float(GLOBAL_ACCURACY),
    "details": (
        "Predictions leverage a GradientBoostingRegressor trained on historic spoilage data. "
        "Higher temperatures accelerate microbial growth and correlate with increased food waste, "
        "so the app factors local weather into its recommendations."
        " source: https://www.channelnewsasia.com/singapore/singapore-farms-damaged-crops-depleted-livestock-yields-recent-hotter-warmer-weather-higher-temperatures-3508216"
    ),
    "top_items": GLOBAL_TOP["commodity"].tolist(),
}
GLOBAL_MODEL_INFO["conclusion"] = (
    f"Using regression (R^2={GLOBAL_MODEL_INFO['accuracy']:.2f}), top wasted foods are "
    + ", ".join(GLOBAL_MODEL_INFO["top_items"])
    + "."
)


def calculate_global_waste_steps(limit: int = 5):
    """Return step-by-step transformation for global waste data."""
    df = WASTAGE_DF.copy()
    steps = []
    steps.append({"step": "load_data", "description": f"Loaded {len(df)} rows", "rows": int(len(df))})
    df["loss_percentage"] = pd.to_numeric(df["loss_percentage"], errors="coerce")
    before = len(df)
    df = df.dropna(subset=["loss_percentage", "commodity", "activity", "food_supply_stage"])
    cleaned = len(df)
    steps.append(
        {
            "step": "clean_data",
            "description": f"Removed {before - cleaned} rows with missing values; {cleaned} rows remain",
            "rows": int(cleaned),
        }
    )
    features = ["commodity", "activity", "food_supply_stage"]
    X = df[features]
    y = df["loss_percentage"]
    pre = ColumnTransformer([("cat", OneHotEncoder(handle_unknown="ignore"), features)])
    model = GradientBoostingRegressor(random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipe = Pipeline(steps=[("pre", pre), ("model", model)])
    pipe.fit(X_train, y_train)
    preds = pipe.predict(X_test)
    accuracy = r2_score(y_test, preds)
    steps.append({"step": "train_model", "description": f"Trained model with R^2={accuracy:.2f}"})
    all_preds = pipe.predict(X)
    df["predicted_loss"] = all_preds
    top = (
        df.groupby("commodity")["predicted_loss"]
        .mean()
        .sort_values(ascending=False)
        .head(limit)
        .reset_index()
    )
    steps.append(
        {
            "step": "top_waste_items",
            "description": "Identified top wasted items globally",
            "top": top.rename(columns={"predicted_loss": "loss_percentage"}).to_dict(orient="records"),
        }
    )
    return steps


@app.get("/global_waste_steps")
def global_waste_steps(limit: int = 5):
    """Return transformation steps for animation."""
    return calculate_global_waste_steps(limit)

# Load shelf life data from CSV and prepare fuzzy matching
DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "shelf_life.csv")
SHELF_LIFE_DF = pd.read_csv(DATA_PATH)
SHELF_LIFE_LOOKUP = {
    row["item"].lower(): row["shelf_life_days"] for _, row in SHELF_LIFE_DF.iterrows()
}

def get_avg_shelf_life(name: str) -> tuple[str, int]:
    """Return the matched item name and its average shelf life in days."""
    if not SHELF_LIFE_LOOKUP:
        return name, 7
    match = process.extractOne(name.lower(), list(SHELF_LIFE_LOOKUP.keys()), scorer=fuzz.WRatio)
    if match and match[1] >= 60:
        matched = match[0]
        return matched, int(SHELF_LIFE_LOOKUP[matched])
    return name, 7

class InventoryItem(BaseModel):
    item: str
    category: str  # e.g., "vegetable", "meat", "dairy", "grains"
    arrival_date: str  # Expecting 'YYYY-MM-DD' string
    city: str

@app.get("/")
def read_root():
    return {"message": "SmartInventory backend is running "}

@app.get("/weather")
def fetch_weather(city: str = Query(..., description="City to fetch weather for")):
    """Return weather data for the requested city."""
    data = get_weather(city)
    return data

@app.post("/inventory")
def recommend_inventory(item: InventoryItem):
    # Fetching weather data
    weather_data = get_weather(item.city)
    forecast_days = weather_data.get("forecast", [])
    temps = [day["avg_temp_c"] for day in forecast_days]
    humidities = [day.get("avg_humidity", 0) for day in forecast_days]
    rains = [day.get("chance_of_rain", 0) for day in forecast_days]
    avg_temp = sum(temps) / len(temps) if temps else 0
    avg_humidity = sum(humidities) / len(humidities) if humidities else 0
    avg_rain = sum(rains) / len(rains) if rains else 0

    if forecast_days:
        explanation = (
            f"Due to current conditions: Temp {avg_temp:.1f}°C, "
            f"Humidity {avg_humidity:.1f}%, Rain chance {avg_rain}%."
        )
    else:
        explanation = "Weather data unavailable; using default assumptions."

    # Calculating days in stock
    arrival = datetime.strptime(item.arrival_date, '%Y-%m-%d')
    days_in_stock = (datetime.now() - arrival).days

    # Lookup avg shelf life (default to 7 days if unknown)
    _, avg_life = get_avg_shelf_life(item.item)

    # Check if item is in CSV commodities for ML prediction
    csv_commodities = [
        'wheat', 'maize (corn)', 'rice', 'rice, milled', 'sorghum', 'barley',
        'oats', 'millet', 'buckwheat', 'groundnuts, excluding shelled'
    ]
    
    if item.item.lower() in csv_commodities and item.category.lower() == 'grains' or item.category.lower() == 'nuts':
        # Preparing data for ML model
        data = pd.DataFrame({
            "commodity": [item.item],
            "activity": ["Storage"],  # Assuming storage as the primary concern
            "food_supply_stage": ["Storage"],
            "storage_days": [days_in_stock]
        })
        # Predicting loss percentage
        loss_percentage = model.predict(data)[0] / 100  # Convert to decimal
        risk_factor = min(loss_percentage, 1)  # Scale 0–1
    else:
        # Fallback to rule-based risk calculation for non-CSV items
        month = datetime.now().month
        risk_score = calculate_spoilage_risk(avg_temp, avg_humidity, avg_rain, month, item.category)
        risk_factor = min(risk_score / 10, 1)  # Scale 0–1
        loss_percentage = risk_factor * 10  # Approximate percentage for consistency

    # Adjusted shelf life factoring in risk (at most 50% reduction, min 1 day)
    adjusted_shelf_life = max(round(avg_life * (1 - 0.5 * risk_factor)), 1)
    remaining_days = adjusted_shelf_life - days_in_stock

    # Track spoilage stats
    SPOILAGE_HISTORY.append({
        "item": item.item.lower(),
        "city": item.city.lower(),
        "loss_percentage": float(loss_percentage * 100),
    })

    # Generating recommendation
    if remaining_days <= 0:
        advice = f"❌ Your {item.item} has likely spoiled due to weather risks and time in storage. Please remove immediately."
    elif risk_factor >= 0.6:  # Equivalent to risk_score >= 6 or loss_percentage >= 6%
        advice = f"⚠️ High spoilage risk for {item.item}. Reduce stock and prioritize clearance. Estimated remaining shelf life: {remaining_days} days."
        if item.item.lower() == "rice, milled":
            advice += " Consider implementing rodent trapping to reduce losses."
    elif risk_factor >= 0.3:  # Equivalent to risk_score >= 3
        advice = f"⚠️ Moderate spoilage risk for {item.item}. Monitor closely. Estimated remaining shelf life: {remaining_days} days."
    else:
        advice = f"✅ Low spoilage risk for {item.item}. Safe to stock normally. Estimated remaining shelf life: {remaining_days} days."

    return {
        "recommendation": advice,
        "risk_score": float(risk_factor * 10),  # Return as 0–10 scale for consistency
        "loss_percentage": float(loss_percentage * 100),  # Return as percentage
        "days_in_stock": days_in_stock,
        "avg_shelf_life": avg_life,
        "adjusted_shelf_life": adjusted_shelf_life,
        "weather_explanation": explanation,
    }


@app.get("/shelf_life")
def shelf_life_lookup(item: str):
    """Return average shelf life for a user-provided item."""
    name, avg = get_avg_shelf_life(item)
    return {"item": name, "avg_shelf_life": avg}


@app.get("/global_waste")
def global_waste(limit: int = 5):
    """Return top wasted items predicted by the global model."""
    top = GLOBAL_TOP.head(limit).copy()
    top = top.rename(columns={"predicted_loss": "loss_percentage"})
    top["country"] = "Global"
    return top.to_dict(orient="records")


@app.get("/store_spoiled")
def store_spoiled(city: str):
    """Return spoilage stats for a specific city/store."""
    if not SPOILAGE_HISTORY:
        return []
    df = pd.DataFrame(SPOILAGE_HISTORY)
    city_df = df[df["city"] == city.lower()]
    if city_df.empty:
        return []
    items = (
        city_df.groupby("item")["loss_percentage"]
        .mean()
        .sort_values(ascending=False)
        .reset_index()
    )
    return items.to_dict(orient="records")


class DeleteItem(BaseModel):
    city: str
    item: str


@app.delete("/store_spoiled")
def delete_store_item(data: DeleteItem):
    """Remove all history entries for a given item in a city."""
    global SPOILAGE_HISTORY
    before = len(SPOILAGE_HISTORY)
    SPOILAGE_HISTORY = [
        record
        for record in SPOILAGE_HISTORY
        if not (record["city"] == data.city.lower() and record["item"] == data.item.lower())
    ]
    deleted = before - len(SPOILAGE_HISTORY)
    return {"deleted": deleted}


@app.get("/model_info")
def model_info():
    """Explain the ML model, accuracy and top wasted foods."""
    return GLOBAL_MODEL_INFO

def calculate_spoilage_risk(avg_temp, humidity, chance_of_rain, month, category):
    risk = 0

    # Temperature risk
    if avg_temp > 30:
        risk += 3
    elif avg_temp > 25:
        risk += 1

    # Humidity risk
    if humidity > 75:
        risk += 3
    elif humidity > 60:
        risk += 1

    # Rain risk
    if chance_of_rain > 70:
        risk += 2
    elif chance_of_rain > 40:
        risk += 1

    # Seasonal adjustments based on month (Singapore tropical climate example)
    if month in [7, 8, 9]:  # peak hot rainy season
        risk += 2
    elif month in [1, 2, 3, 10, 11, 12]:
        risk += 1

    # Category specific tweaks
    perishables = ['vegetable', 'dairy', 'fruit']
    if category.lower() in perishables:
        risk += 2

    return risk


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

