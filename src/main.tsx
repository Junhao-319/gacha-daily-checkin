import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ArtworkSyncProvider } from "./lib/artworkSync";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ArtworkSyncProvider>
      <App />
    </ArtworkSyncProvider>
  </StrictMode>
);