import React, { useState, useEffect } from "react";
import "./App.css";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);
ChartJS.defaults.color = "#FFFFFF";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

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
  const [globalWaste, setGlobalWaste] = useState([]);
  const [storeStats, setStoreStats] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);

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
      const res = await fetch(`${API_URL}/inventory`, {
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
      fetchModelInfo();
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
        `${API_URL}/shelf_life?item=${encodeURIComponent(shelfItem)}`
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

  const fetchGlobalWaste = async () => {
    try {
      const res = await fetch(`${API_URL}/global_waste`);
      const data = await res.json();
      setGlobalWaste(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchModelInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/model_info`);
      const data = await res.json();
      setModelInfo(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStoreStats = async (cityName) => {
    try {
      const res = await fetch(
        `${API_URL}/store_spoiled?city=${encodeURIComponent(cityName)}`
      );
      const data = await res.json();
      setStoreStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (itemName) => {
    try {
      await fetch(`${API_URL}/store_spoiled`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, item: itemName }),
      });
      fetchStoreStats(city);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGlobalWaste();
    fetchStoreStats(city);
  }, []);

  useEffect(() => {
    if (recommendation) {
      fetchStoreStats(city);
    }
  }, [recommendation, city]);

  useEffect(() => {
    fetchStoreStats(city);
  }, [city]);

  const topGlobal = globalWaste[0];

  return (
    <div className="app-wrapper">
      <div className="container">
        <h1
          className="fade-in glitch"
          title="Smart Inventory Spoilage Predictor"
        >
          Smart Inventory Spoilage Predictor
        </h1>

      <div className="card">
        <h2>Lookup Shelf Life</h2>
        <input
          type="text"
          value={shelfItem}
          onChange={(e) => setShelfItem(e.target.value)}
          placeholder="e.g. Milk"
          style={{ width: "70%", padding: 8 }}
        />
        <button type="button" onClick={handleShelfSearch}>
          Search
        </button>
        {shelfResult && (
          <div style={{ marginTop: 10 }}>
            <p>
              Average shelf life for <strong>{shelfResult.item}</strong>: {shelfResult.avg_shelf_life} days
            </p>
            {globalWaste.some(
              (i) => i.commodity.toLowerCase() === shelfResult.item.toLowerCase()
            ) && (
              <p style={{ color: "red" }}>
                This item is among the most wasted globally!
              </p>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Item Name:</label>
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="e.g. Rice, milled"
            required
          />
        </div>

        <div className="field">
          <label>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
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

        <div className="field">
          <label>City:</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Singapore"
            required
          />
        </div>

        <div className="field">
          <label>Arrival Date:</label>
          <input
            type="date"
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Calculating..." : "Get Recommendation"}
        </button>
      </form>

      {error && (
        <div className="card" style={{ color: "red" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {recommendation && (
        <div className="card fade-in">
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

        <div className="chart-grid">
          {globalWaste.length > 0 && (
            <div className="card fade-in">
              <h2>Global Food Wastage</h2>
              <Pie
                data={{
                  labels: globalWaste.map(
                    (d) => `${d.commodity} (${d.country})`
                  ),
                  datasets: [
                    {
                      data: globalWaste.map((d) => d.loss_percentage),
                      backgroundColor: [
                        "#FF6384",
                        "#36A2EB",
                        "#FFCE56",
                        "#4BC0C0",
                        "#9966FF",
                      ],
                    },
                  ],
                }}
              />
              {topGlobal && (
                <p className="chart-note">
                  Most wasted item globally: {topGlobal.commodity} (
                  {topGlobal.loss_percentage.toFixed(1)}%)
                </p>
              )}
            </div>
          )}

          {storeStats.length > 0 && (
            <div className="card fade-in">
              <h2>{city} Store Items</h2>
              <Bar
                data={{
                  labels: storeStats.map((d) => d.item),
                  datasets: [
                    {
                      label: "Loss %",
                      data: storeStats.map((d) => d.loss_percentage),
                      backgroundColor: "rgba(75,192,192,0.5)",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
              <ul className="item-list">
                {storeStats.map((s) => (
                  <li key={s.item}>
                    <span>
                      {s.item} ({s.loss_percentage.toFixed(1)}%)
                    </span>
                    <button onClick={() => handleDelete(s.item)}>Remove</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      {modelInfo && (
        <div className="model-info fade-in">
          <h2>Model Insight</h2>
          <p>
            <strong>{modelInfo.model}</strong> (R² {modelInfo.accuracy.toFixed(2)})
          </p>
          <p>{modelInfo.details}</p>
          {modelInfo.conclusion && <p><em>{modelInfo.conclusion}</em></p>}
        </div>
      )}
    </div>
  );
}

export default App;
