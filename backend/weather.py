import requests
import os

API_KEY = os.getenv("WEATHER_API_KEY")

def get_weather(city):
    url = f"http://api.weatherapi.com/v1/forecast.json?key=95b3d3f77fb242a287470246253107&q={city}&days=3&aqi=no&alerts=yes"
    response = requests.get(url)
    data = response.json()

    forecast_data = []
    for day in data["forecast"]["forecastday"]:
        forecast_data.append({
            "date": day["date"],
            "avg_temp_c": day["day"]["avgtemp_c"],
            "max_temp_c": day["day"]["maxtemp_c"],
            "min_temp_c": day["day"]["mintemp_c"],
            "chance_of_rain": day["day"]["daily_chance_of_rain"],
            "condition": day["day"]["condition"]["text"],
            "avg_humidity": day["day"].get("avghumidity", 0)
        })

    return {
        "location": data["location"]["name"],
        "country": data["location"]["country"],
        "forecast": forecast_data
    }
