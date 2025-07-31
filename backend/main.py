from fastapi import FastAPI
from weather import get_weather
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


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

from pydantic import BaseModel

class InventoryItem(BaseModel):
    item: str
    category: str  # e.g., "vegetable", "meat", "dairy"
    expires_in_days: int
    city: str

@app.post("/inventory")
def recommend_inventory(item: InventoryItem):
    weather_data = get_weather(item.city)

    # Check rain chance for next 3 days
    rain_days = [day for day in weather_data["forecast"] if day["chance_of_rain"] > 70]

    if item.category.lower() in ["vegetable", "dairy"] and rain_days:
        return {
            "recommendation": f"⚠️ Consider reducing {item.item} stock. Upcoming rain may reduce customer flow. Try to clear stock within {item.expires_in_days} days."
        }

    return {
        "recommendation": f"✅ Safe to stock {item.item}. No weather concerns ahead. Monitor expiry: {item.expires_in_days} days."
    }

