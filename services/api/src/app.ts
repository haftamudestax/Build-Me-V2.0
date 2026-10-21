
import express, { Request, Response } from "express";
import bookingRoutes from "./routes/Routes";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.send("Server is running");
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

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
