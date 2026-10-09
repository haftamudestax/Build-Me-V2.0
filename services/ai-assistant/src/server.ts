import 'dotenv/config';
import { createApp } from './app';

const PORT = process.env.AI_ASSISTANT_PORT ?? 4100;

const app = createApp();

app.listen(PORT, () => {
  console.log(`AI Assistant service running on http://127.0.0.1:${PORT}`);
});
