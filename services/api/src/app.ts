import express, { Request, Response } from "express";
import bookingRoutes from "./routes/Routes";
import analyticsRoutes from "./routes/analyticsRoutes";
import cors from "cors";

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  "http://127.0.0.1:5177",
]);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests without an Origin header.
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);


app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.send("Server is running");
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api", bookingRoutes);

app.get("/api/events", async (_req: Request, res: Response) => {
  res.json({ message: "Events API endpoint is working" });
});

app.get("/api/leads", async (_req: Request, res: Response) => {
  res.json({ message: "Leads API endpoint is working" });
});

app.use(
  (
    err: unknown,
    _req: Request,
    res: Response,
    next: express.NextFunction
  ) => {
    if (
      typeof err === "object" &&
      err !== null &&
      "type" in err &&
      err.type === "entity.too.large"
    ) {
      return res.status(413).json({
        error: "Payload too large",
      });
    }

    if (
      err instanceof SyntaxError &&
      "body" in err
    ) {
      return res.status(400).json({
        error: "Invalid JSON",
      });
    }

    next(err);
  }
);

export default app;
