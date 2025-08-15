import React, { useState } from "react";
import Home from "./Home";
import About from "./About";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");
  return (
    <div className="app-wrapper">
      <nav className="card fade-in">
        <button onClick={() => setPage("home")} style={{ marginRight: 10 }}>
          Home
        </button>
        <button onClick={() => setPage("about")}>About</button>
      </nav>
      {page === "about" ? <About /> : <Home />}
    </div>
  );
}

export default App;
