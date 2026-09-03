import app from "./app";

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://127.0.0.1:${PORT}`);
});