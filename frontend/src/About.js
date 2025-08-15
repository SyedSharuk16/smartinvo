import React, { useEffect, useState } from "react";
import "./App.css";

function About() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className="app-wrapper">
      <div className="container">
        <div className={`card ${visible ? "fade-in" : ""}`}>
          <h1>About SmartInvo</h1>
          <p>
            SmartInvo was created by <strong>Syed Sharuk</strong> to help shops cut
            food waste with data science.
          </p>
          <p>
            Our models blend store inventory, weather patterns and shelf life
            research to predict spoilage before it happens and suggest smarter
            restocking.
          </p>
          <p>
            We draw insights from real events like heat-related crop losses in
            Singapore reported by <a
              href="https://www.channelnewsasia.com/singapore/singapore-farms-damaged-crops-depleted-livestock-yields-recent-hotter-warmer-weather-higher-temperatures-3508216"
              target="_blank"
              rel="noreferrer"
            >Channel News Asia</a> and global food loss data collected by the <a
              href="https://www.fao.org/platform-food-loss-waste/flw-data/en"
              target="_blank"
              rel="noreferrer"
            >FAO</a>.
          </p>
          <p>
            Unlike typical inventory apps, SmartInvo mixes machine learning with
            environmental signals to give proactive guidance that keeps food
            fresher for longer.
          </p>
        </div>
      </div>
    </div>
  );
}

export default About;
