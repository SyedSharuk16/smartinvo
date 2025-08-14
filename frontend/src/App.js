import React, { useState } from "react";

function App() {
  const [item, setItem] = useState("");
  const [category, setCategory] = useState("vegetable");
  const [city, setCity] = useState("Singapore");
  const [arrivalDate, setArrivalDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!item || !category || !city || !arrivalDate) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setRecommendation(null);

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
      setRecommendation(data);
    } catch (err) {
      setError(err.message);
      setRecommendation(null);
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
            placeholder="e.g. Rice, milled"
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
            <option value="grains">Grains</option>
            <option value="nuts">Nuts</option>
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
          <p>{recommendation.recommendation}</p>
          {recommendation.loss_percentage !== undefined && (
            <p><strong>Predicted Loss (%):</strong> {recommendation.loss_percentage.toFixed(2)}%</p>
          )}
          {recommendation.risk_score !== undefined && (
            <p><strong>Risk Score:</strong> {recommendation.risk_score.toFixed(1)}</p>
          )}
          {recommendation.days_in_stock !== undefined && (
            <p><strong>Days in Stock:</strong> {recommendation.days_in_stock}</p>
          )}
          {recommendation.avg_shelf_life !== undefined && (
            <p><strong>Average Shelf Life:</strong> {recommendation.avg_shelf_life} days</p>
          )}
          {recommendation.adjusted_shelf_life !== undefined && (
            <p><strong>Adjusted Shelf Life:</strong> {recommendation.adjusted_shelf_life} days</p>
          )}
          {recommendation.weather_explanation && (
            <p><em>{recommendation.weather_explanation}</em></p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;