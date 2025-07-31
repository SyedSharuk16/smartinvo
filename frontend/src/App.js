import React, { useEffect, useState } from 'react';

function App() {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState('Singapore');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/weather?city=${city}`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        console.log("Fetched weather:", data); // Debug log
        setWeather(data);
      } catch (err) {
        setError(err.message);
        setWeather(null);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [city]);

  const handleCityChange = (e) => {
    setCity(e.target.value);
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1>🌤️ Weather Forecast</h1>
      
      <input
        type="text"
        value={city}
        onChange={handleCityChange}
        placeholder="Enter city name"
        style={{
          padding: 10,
          width: '100%',
          marginBottom: 20,
          fontSize: 16,
          borderRadius: 5,
          border: '1px solid #ccc'
        }}
      />

      {loading && <div>Loading weather data for <strong>{city}</strong>...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {weather && weather.forecast ? (
        <div>
          <h2>Forecast for {weather.location}, {weather.country}</h2>
          {weather.forecast.map(day => (
            <div key={day.date} style={{
              border: '1px solid #ccc',
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
              backgroundColor: '#f9f9f9'
            }}>
              <h3>{day.date}</h3>
              <p>Avg Temp: <strong>{day.avg_temp_c}°C</strong></p>
              <p>Max Temp: {day.max_temp_c}°C</p>
              <p>Min Temp: {day.min_temp_c}°C</p>
              <p>Rain Chance: {day.chance_of_rain}%</p>
              <p>Condition: {day.condition}</p>
            </div>
          ))}
        </div>
      ) : !loading && (
        <p>No weather data available.</p>
      )}
    </div>
  );
}

export default App;
