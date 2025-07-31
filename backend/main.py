from fastapi import FastAPI
from weather import get_weather
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime


load_dotenv()

app = FastAPI()
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "SmartInventory backend is running "}

@app.get("/weather")
def fetch_weather(city: str = "Singapore"):
    data = get_weather(city)
    return data

# Average shelf life in days for common items
# This is a simplified example; in a real app, this could be more comprehensive
AVG_SHELF_LIFE = {
    ('spinach', 'vegetable'): 5,
    ('apple', 'fruit'): 30,
    ('milk', 'dairy'): 7,
    ('frozen peas', 'frozen'): 180,
    # will add more items as needed
}

class InventoryItem(BaseModel):
    item: str
    category: str  # e.g., "vegetable", "meat", "dairy"
    arrival_date: str  # Expecting 'YYYY-MM-DD' string
    city: str

@app.post("/inventory")
def recommend_inventory(item: InventoryItem):
    weather_data = get_weather(item.city)

    temps = [day['avg_temp_c'] for day in weather_data['forecast']]
    humidities = [day.get('avghumidity', 50) for day in weather_data['forecast']]
    rains = [day['chance_of_rain'] for day in weather_data['forecast']]

    avg_temp = sum(temps) / len(temps)
    avg_humidity = sum(humidities) / len(humidities)
    avg_rain = sum(rains) / len(rains)

    month = datetime.now().month

    risk_score = calculate_spoilage_risk(avg_temp, avg_humidity, avg_rain, month, item.category)

    # Calculate days in stock
    arrival = datetime.strptime(item.arrival_date, '%Y-%m-%d')
    days_in_stock = (datetime.now() - arrival).days

    # Lookup avg shelf life (default to 7 days if unknown)
    avg_life = AVG_SHELF_LIFE.get((item.item.lower(), item.category.lower()), 7)

    # Adjusted shelf life factoring in risk (higher risk shortens shelf life)
    adjusted_shelf_life = max(avg_life - risk_score, 0)

    remaining_days = adjusted_shelf_life - days_in_stock

    if remaining_days <= 0:
        advice = (f"❌ Your {item.item} has likely spoiled due to weather risks and time in storage. "
                  f"Please remove immediately.")
    elif risk_score >= 6:
        advice = (f"⚠️ High spoilage risk for {item.item}. Reduce stock and prioritize clearance. "
                  f"Estimated remaining shelf life: {remaining_days} days.")
    elif risk_score >= 3:
        advice = (f"⚠️ Moderate spoilage risk for {item.item}. Monitor closely. "
                  f"Estimated remaining shelf life: {remaining_days} days.")
    else:
        advice = (f"✅ Low spoilage risk for {item.item}. Safe to stock normally. "
                  f"Estimated remaining shelf life: {remaining_days} days.")

    # Extra explanation about weather effect
    explanation = f"Due to current conditions: Temp {avg_temp:.1f}°C, Humidity {avg_humidity:.1f}%, Rain chance {avg_rain}%."

    return {
        "recommendation": advice,
        "risk_score": risk_score,
        "days_in_stock": days_in_stock,
        "avg_shelf_life": avg_life,
        "adjusted_shelf_life": adjusted_shelf_life,
        "weather_explanation": explanation
    }


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
    # Jan-Mar (1-3): medium temps, medium rain
    # Apr-Jun (4-6): hotter, less rain
    # Jul-Sep (7-9): hot and rainy
    # Oct-Dec (10-12): moderate temp, rainy
    if month in [7, 8, 9]:  # peak hot rainy season
        risk += 2
    elif month in [1, 2, 3, 10, 11, 12]:
        risk += 1

    # Category specific tweaks
    perishables = ['vegetable', 'dairy', 'fruit']
    if category.lower() in perishables:
        risk += 2

    return risk


