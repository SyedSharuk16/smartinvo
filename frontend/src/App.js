import React, { useEffect, useState } from 'react';

function App() {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState('Singapore');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inventory states
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('vegetable');
  const [expiresInDays, setExpiresInDays] = useState(3);
  const [inventoryAdvice, setInventoryAdvice] = useState(null);

  // Fetch weather forecast
  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/weather?city=${city}`);
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        setError('Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [city]);

  // Handle inventory form submission
  const handleInventorySubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://127.0.0.1:8000/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item,
          category,
          expires_in_days: parseInt(expiresInDays),
          city
        })
      });

      const data = await res.json();
      setInventoryAdvice(data.recommendation);
    } catch (err) {
      setInventoryAdvice('❌ Error contacting backend.');
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', maxWidth: 700, margin: '0 auto' }}>
      <h1>🌤️ Smart Weather Forecast</h1>
      
      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Enter city"
        style={{ padding: 10, width: '100%', marginBottom: 20 }}
      />

      {loading && <p>Loading weather for {city}...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {weather && weather.forecast && (
        <div>
          <h2>Forecast for {weather.location}, {weather.country}</h2>
          {weather.forecast.map((day) => (
            <div key={day.date} style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10 }}>
              <strong>{day.date}</strong>
              <p>{day.condition}</p>
              <p>Avg Temp: {day.avg_temp_c}°C</p>
              <p>Chance of Rain: {day.chance_of_rain}%</p>
            </div>
          ))}
        </div>
      )}

      <hr style={{ margin: '40px 0' }} />

      <h2>🛒 Inventory Recommendation</h2>
      <form onSubmit={handleInventorySubmit}>
        <input
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="Item name (e.g., spinach)"
          required
          style={{ padding: 10, width: '100%', marginBottom: 10 }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: 10, width: '100%', marginBottom: 10 }}
        >
          <option value="vegetable">Vegetable</option>
          <option value="meat">Meat</option>
          <option value="dairy">Dairy</option>
          <option value="fruit">Fruit</option>
          <option value="frozen">Frozen</option>
        </select>
        <input
          type="number"
          value={expiresInDays}
          onChange={(e) => setExpiresInDays(e.target.value)}
          placeholder="Expires in (days)"
          required
          style={{ padding: 10, width: '100%', marginBottom: 10 }}
        />
        <button type="submit" style={{ padding: 12, width: '100%', backgroundColor: '#4CAF50', color: 'white', fontWeight: 'bold' }}>
          Get Recommendation
        </button>
      </form>

      {inventoryAdvice && (
        <div style={{ marginTop: 20, padding: 15, border: '1px solid #4CAF50', backgroundColor: '#f0fff0' }}>
          <strong>Recommendation:</strong>
          <p>{inventoryAdvice}</p>
        </div>
      )}
    </div>
  );
}

export default App;
