import os
import requests

API_KEY = os.getenv("WEATHER_API_KEY")


def get_weather(city: str):

    if not API_KEY:
        return {"location": city, "country": "", "forecast": []}

    url = "https://api.weatherapi.com/v1/forecast.json"
    params = {
        "key": API_KEY,
        "q": city,
        "days": 3,
        "aqi": "no",
        "alerts": "yes",
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError):
        return {"location": city, "country": "", "forecast": []}

    forecast_data = []
    for day in data.get("forecast", {}).get("forecastday", []):
        forecast_data.append(
            {
                "date": day["date"],
                "avg_temp_c": day["day"]["avgtemp_c"],
                "max_temp_c": day["day"]["maxtemp_c"],
                "min_temp_c": day["day"]["mintemp_c"],
                "chance_of_rain": day["day"]["daily_chance_of_rain"],
                "condition": day["day"]["condition"]["text"],
                "avg_humidity": day["day"].get("avghumidity", 0),
            }
        )

    return {
        "location": data.get("location", {}).get("name", city),
        "country": data.get("location", {}).get("country", ""),
        "forecast": forecast_data,
    }
