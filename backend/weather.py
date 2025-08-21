import os
import requests


def get_weather(city: str):
    """Fetch a three-day weather forecast for ``city``.

    Returns a dictionary containing the resolved location name, country and a
    list of per-day forecast details. Each day's entry may omit values if the
    upstream API does not provide them.
    """

    api_key = os.getenv("WEATHER_API_KEY")
    if not api_key:
        return {"location": city, "country": "", "forecast": []}

    url = "https://api.weatherapi.com/v1/forecast.json"
    params = {
        "key": api_key,
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
        day_info = day.get("day", {})
        forecast_data.append(
            {
                "date": day.get("date"),
                "avg_temp_c": day_info.get("avgtemp_c"),
                "max_temp_c": day_info.get("maxtemp_c"),
                "min_temp_c": day_info.get("mintemp_c"),
                "chance_of_rain": day_info.get("daily_chance_of_rain"),
                "condition": day_info.get("condition", {}).get("text"),
                "avg_humidity": day_info.get("avghumidity"),
            }
        )

    return {
        "location": data.get("location", {}).get("name", city),
        "country": data.get("location", {}).get("country", ""),
        "forecast": forecast_data,
    }
