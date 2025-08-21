import os
import requests


def get_weather(city: str):
    """Fetch a three-day weather forecast for ``city``.

    Returns a dictionary containing the resolved location name, country and a
    list of per-day forecast details. Each day's entry may omit values if the
    upstream API does not provide them. If the API key is missing or the
    request fails, the returned object will include an ``error`` field so the
    caller can display a helpful message.
    """

    api_key = os.getenv("WEATHER_API_KEY")
    if not api_key:
        # Surface the missing key to callers so they can display an
        # informative message rather than silently showing empty data.
        return {
            "location": city,
            "country": "",
            "forecast": [],
            "error": "missing-api-key",
        }

    url = "https://api.weatherapi.com/v1/forecast.json"
    params = {
        "key": api_key,
        "q": city,
        "days": 3,
        "aqi": "no",
        "alerts": "no",
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
    except (requests.RequestException, ValueError):
        # Network errors or unexpected payloads should also be reported
        # back to the caller so the frontend can react accordingly.
        return {
            "location": city,
            "country": "",
            "forecast": [],
            "error": "unavailable",
        }

    if response.status_code != 200 or data.get("error"):
        message = data.get("error", {}).get("message", "unavailable")
        return {
            "location": city,
            "country": "",
            "forecast": [],
            "error": message,
        }

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
