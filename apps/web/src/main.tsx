import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/Routes.tsx";
import { configureNavAnalytics } from "@build-me/ui/navbar";
import { configureAnalytics } from "@build-me/utils";
import "./index.css";

const analyticsBaseUrl = import.meta.env.VITE_ANALYTICS_URL ?? null;

async function initializeApp() {
  if (analyticsBaseUrl) {
    const baseUrl = analyticsBaseUrl.replace(/\/+$/, "");

    try {
      const response = await fetch(`${baseUrl}/visitors`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Visitor registration failed: ${response.status}`);
      }

      const registration: {
        visitor_id: string;
        session_id: string;
      } = await response.json();

      const analyticsConfig = {
        baseUrl,
        visitorId: registration.visitor_id,
        sessionId: registration.session_id,
      };

      // Configure the shared analytics client.
      configureAnalytics(analyticsConfig);

      // Configure Navbar analytics with the same identity.
      configureNavAnalytics(analyticsConfig);
    } catch (error) {
      console.error("Analytics initialization failed:", error);

      const analyticsConfig = {
        baseUrl,
        visitorId: null,
        sessionId: null,
      };

      // Clear the shared analytics identity on failure.
      configureAnalytics(analyticsConfig);

      // Keep Navbar analytics configuration consistent.
      configureNavAnalytics(analyticsConfig);
    }
  }

  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error('Root element "#root" was not found.');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

void initializeApp();
