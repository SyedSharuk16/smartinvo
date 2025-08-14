import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function App() {
  const [item, setItem] = useState("");
  const [category, setCategory] = useState("vegetable");
  const [city, setCity] = useState("Singapore");
  const [arrivalDate, setArrivalDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [shelfItem, setShelfItem] = useState("");
  const [shelfResult, setShelfResult] = useState(null);
  const [topSpoiled, setTopSpoiled] = useState([]);

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

  const handleShelfSearch = async () => {
    if (!shelfItem.trim()) return;
    setError(null);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/shelf_life?item=${encodeURIComponent(shelfItem)}`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch shelf life");
      }
      const data = await res.json();
      setShelfResult(data);
    } catch (err) {
      setError(err.message);
      setShelfResult(null);
    }
  };

  const fetchTopSpoiled = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/top_spoiled");
      const data = await res.json();
      setTopSpoiled(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTopSpoiled();
  }, []);

  useEffect(() => {
    if (recommendation) {
      fetchTopSpoiled();
    }
  }, [recommendation]);

  return (
    <div style={{ maxWidth: 600, margin: "auto", fontFamily: "Arial, sans-serif", padding: 20 }}>
      <h1>Smart Inventory Spoilage Predictor</h1>

      <div style={{ marginBottom: 20 }}>
        <h2>Lookup Shelf Life</h2>
        <input
          type="text"
          value={shelfItem}
          onChange={(e) => setShelfItem(e.target.value)}
          placeholder="e.g. Milk"
          style={{ width: "70%", padding: 8 }}
        />
        <button
          type="button"
          onClick={handleShelfSearch}
          style={{ padding: "8px 12px", marginLeft: 10 }}
        >
          Search
        </button>
        {shelfResult && (
          <div style={{ marginTop: 10 }}>
            <p>
              Average shelf life for <strong>{shelfResult.item}</strong>: {shelfResult.avg_shelf_life} days
            </p>
            {topSpoiled.some(
              (i) => i.item.toLowerCase() === shelfResult.item.toLowerCase()
            ) && <p style={{ color: "red" }}>This item is among the top spoiled items!</p>}
          </div>
        )}
      </div>

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

      {topSpoiled.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h2>Top Spoiled Items</h2>
          <Bar
            data={{
              labels: topSpoiled.map((d) => d.item),
              datasets: [
                {
                  label: "Loss %",
                  data: topSpoiled.map((d) => d.loss_percentage),
                  backgroundColor: "rgba(255,99,132,0.5)",
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
