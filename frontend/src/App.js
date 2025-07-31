import React, { useState } from "react";

function App() {
  const [item, setItem] = useState("");
  const [category, setCategory] = useState("vegetable");
  const [city, setCity] = useState("Singapore");
  const [arrivalDate, setArrivalDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [recommendation, setRecommendation] = useState(null);
  const [riskScore, setRiskScore] = useState(null);
  const [daysInStock, setDaysInStock] = useState(null);
  const [avgShelfLife, setAvgShelfLife] = useState(null);
  const [adjustedShelfLife, setAdjustedShelfLife] = useState(null);
  const [weatherExplanation, setWeatherExplanation] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!item || !category || !city || !arrivalDate) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item: item.trim(),
          category,
          city: city.trim(),
          arrival_date: arrivalDate,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch inventory recommendation");
      }

      const data = await res.json();

      setRecommendation(data.recommendation);
      setRiskScore(data.risk_score);
      setDaysInStock(data.days_in_stock);
      setAvgShelfLife(data.avg_shelf_life);
      setAdjustedShelfLife(data.adjusted_shelf_life);
      setWeatherExplanation(data.weather_explanation);
    } catch (err) {
      setError(err.message);
      setRecommendation(null);
      setRiskScore(null);
      setDaysInStock(null);
      setAvgShelfLife(null);
      setAdjustedShelfLife(null);
      setWeatherExplanation(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", fontFamily: "Arial, sans-serif", padding: 20 }}>
      <h1>Smart Inventory Spoilage Predictor</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <label>Item Name:</label><br />
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="e.g. Spinach"
            style={{ width: "100%", padding: 8 }}
            required
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Category:</label><br />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="vegetable">Vegetable</option>
            <option value="fruit">Fruit</option>
            <option value="dairy">Dairy</option>
            <option value="meat">Meat</option>
            <option value="frozen">Frozen</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>City:</label><br />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Singapore"
            style={{ width: "100%", padding: 8 }}
            required
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Arrival Date:</label><br />
          <input
            type="date"
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            width: "100%",
          }}
        >
          {loading ? "Calculating..." : "Get Recommendation"}
        </button>
      </form>

      {error && (
        <div style={{ color: "red", marginBottom: 10 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {recommendation && (
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: 4,
            padding: 15,
            backgroundColor: "#f9f9f9",
          }}
        >
          <h2>Recommendation</h2>
          <p>{recommendation}</p>

          <p><strong>Risk Score:</strong> {riskScore}</p>
          <p><strong>Days in Stock:</strong> {daysInStock}</p>
          <p><strong>Average Shelf Life:</strong> {avgShelfLife} days</p>
          <p><strong>Adjusted Shelf Life:</strong> {adjustedShelfLife} days</p>
          <p><em>{weatherExplanation}</em></p>
        </div>
      )}
    </div>
  );
}

export default App;
