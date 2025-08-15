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

For frontend deployments, build the React app with an `REACT_APP_API_URL`
environment variable pointing at the backend's base URL:

```
REACT_APP_API_URL=https://smartinvo.onrender.com
```

Trailing slashes are trimmed automatically so both `https://example.com`
and `https://example.com/` will produce the same API base.

The backend allows CORS requests from `http://localhost:3000` by default.
When deploying the frontend to a different domain, specify that URL via the
`FRONTEND_URL` environment variable before starting the backend:

```
export FRONTEND_URL=https://your-frontend.example.com
```

Any trailing slash on this URL is removed automatically.


