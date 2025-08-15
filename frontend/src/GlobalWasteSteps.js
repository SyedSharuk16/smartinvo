import React, { useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function GlobalWasteSteps() {
  const [steps, setSteps] = useState([]);
  const [running, setRunning] = useState(false);

  const startAnimation = async () => {
    setRunning(true);
    try {
      const res = await fetch(`${API_URL}/global_waste_steps`);
      const data = await res.json();
      setSteps([]);
      data.forEach((step, idx) => {
        setTimeout(() => {
          setSteps((prev) => [...prev, step]);
        }, idx * 1000);
      });
      setTimeout(() => setRunning(false), data.length * 1000);
    } catch (err) {
      console.error(err);
      setRunning(false);
    }
  };

  return (
    <div className="card">
      <h2>Data Transformation</h2>
      <button onClick={startAnimation} disabled={running}>
        {running ? "Processing..." : "Show Transformation"}
      </button>
      <ul className="animation-steps">
        {steps.map((s, i) => (
          <li key={i}>
            <strong>{s.step}</strong>: {s.description}
            {s.top && (
              <ul>
                {s.top.map((t) => (
                  <li key={t.commodity}>
                    {t.commodity} ({t.loss_percentage.toFixed(1)}%)
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GlobalWasteSteps;
