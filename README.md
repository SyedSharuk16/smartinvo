# SmartInvo

SmartInvo consists of a FastAPI backend and a React frontend.

## Configuration

The backend optionally uses the WeatherAPI service for more accurate
spoilage predictions. Supply an API key via the `WEATHER_API_KEY`
environment variable to enable this feature:

```
export WEATHER_API_KEY=your_key_here
```

If no key is provided or the weather service is unreachable, the app
falls back to static defaults so inventory recommendations continue to
work.
