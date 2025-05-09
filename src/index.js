import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./firebaseConfig";
import { BrowserRouter } from "react-router-dom"; // ✅ import this

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter> {/* ✅ wrap App */}
    <App />
  </BrowserRouter>
);
