import React, { useState, useEffect } from "react";

import { API_URL } from "./config";

const Typewriter = ({ text }) => {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    setDisplay("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplay((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{display}</span>;
};

const Progress = ({ total }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let current = 0;
    const inc = Math.max(1, Math.floor(total / 100));
    const interval = setInterval(() => {
      current += inc;
      if (current >= total) {
        current = total;
        clearInterval(interval);
      }
      setCount(current);
    }, 20);
    return () => clearInterval(interval);
  }, [total]);
  const percent = (count / total) * 100;
  return (
    <div className="progress-wrapper">
      <div className="progress-bar" style={{ width: `${percent}%` }} />
      <span className="progress-label">{count}/{total}</span>
    </div>
  );
};

function GlobalWasteSteps({ trigger }) {
  const [steps, setSteps] = useState([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    startAnimation();
  }, [trigger]);

  const startAnimation = async () => {
    setRunning(true);
    try {
      const res = await fetch(`${API_URL}/global_waste_steps`);
      const data = await res.json();
      setSteps([]);
      data.forEach((step, idx) => {
        setTimeout(() => {
          setSteps((prev) => [...prev, step]);
          if (idx === data.length - 1) setRunning(false);
        }, idx * 1000);
      });
    } catch (err) {
      console.error(err);
      setRunning(false);
    }
  };

  return (
    <div className="card">
      <h2>Data Transformation from wastage data</h2>
      {running && <p className="loading-dots">Processing</p>}
      <ul className="animation-steps">
        {steps.map((s, i) => (
          <li key={i}>
            <strong>{s.step}</strong>: <Typewriter text={s.description} />
            {s.rows && <Progress total={s.rows} />}
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
