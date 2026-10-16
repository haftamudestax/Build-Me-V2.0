import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/Routes.tsx";
import { configureNavAnalytics } from "@build-me/ui/navbar";
import "./index.css";

const analyticsBaseUrl = import.meta.env.VITE_ANALYTICS_URL ?? null;

async function initializeApp() {
  if (analyticsBaseUrl) {
    try {
      const response = await fetch(
        `${analyticsBaseUrl.replace(/\/+$/, "")}/visitors`,
        { method: "POST" },
      );

      if (!response.ok) {
        throw new Error(`Visitor registration failed: ${response.status}`);
      }

      const registration: {
        visitor_id: string;
        session_id: string;
      } = await response.json();

      configureNavAnalytics({
        baseUrl: analyticsBaseUrl,
        visitorId: registration.visitor_id,
        sessionId: registration.session_id,
      });
    } catch (error) {
      console.error("Analytics initialization failed:", error);

      configureNavAnalytics({
        baseUrl: analyticsBaseUrl,
        visitorId: null,
        sessionId: null,
      });
    }
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

void initializeApp();
