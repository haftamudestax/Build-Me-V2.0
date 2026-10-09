
import express, { Request, Response } from "express";

const app = express();

// Reject JSON request bodies larger than 1 MB with HTTP 413.
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.send("Server is running");
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/api/bookings", async (_req: Request, res: Response) => {
  res.json({ message: "Bookings API endpoint is working" });
});

app.get("/api/events", async (_req: Request, res: Response) => {
  res.json({ message: "Events API endpoint is working" });
});

app.get("/api/leads", async (_req: Request, res: Response) => {
  res.json({ message: "Leads API endpoint is working" });
});

// Return a controlled JSON response for oversized payloads.
app.use(
  (
    err: any,
    _req: Request,
    res: Response,
    next: express.NextFunction
  ) => {
    if (err?.type === "entity.too.large") {
      return res.status(413).json({
        error: "Payload too large",
      });
    }

    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({
        error: "Invalid JSON",
      });
    }

    next(err);
  }
);

export default app;
