import express, { Request, Response } from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});
app.get("/api/bookings", async (req: Request, res: Response) => {
  res.json({ message: "Bookings API endpoint is working" });
});
app.get("/api/events", async (req: Request, res: Response) => {
  res.json({ message: "Events API endpoint is working" });
});
app.get("/api/leads", async (req: Request, res: Response) => {
  res.json({ message: "Leads API endpoint is working" });
});
export default app;
