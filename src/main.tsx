import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Keep an invite code from a link like .../#join=ABC123 until the visitor has signed in.
const invite = location.hash.match(/join=([A-Za-z0-9]{6})/);
if (invite) {
  try { localStorage.setItem("habitkeeper.invite", invite[1].toUpperCase()); } catch { /* private mode */ }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
