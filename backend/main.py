from fastapi import FastAPI
from weather import get_weather
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()

app = FastAPI()
origins = [
    "http://localhost:3000",
    # Add any other origins you want to allow here
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
    return {"message": "SmartInventory backend is running 🚀"}

@app.get("/weather")
def fetch_weather(city: str = "Singapore"):
    data = get_weather(city)
    return data
