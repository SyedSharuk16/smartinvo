
Smartinvo is am app created by me to help grocery store owners predict their stocks's spoilage.
it involves large collection of data and machine learning algoriths to predict the most spoiled items correlating with the user's stock while also influencing weather condition.

The app is backboned by python using gradientboostregressors for training model and exhibiting it via react using cross origin resource sharing.

## Configuration

Weather lookups require an API key from [weatherapi.com](https://www.weatherapi.com/). Set the key in your environment before starting the backend:

```bash
export WEATHER_API_KEY=your_key_here
```

Or create a `.env` file with the same `WEATHER_API_KEY` entry.
