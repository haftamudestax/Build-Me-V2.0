import express from 'express';
import cors from 'cors';
import assistantRoutes from './routes/assistant.routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' })); 

  app.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'ai-assistant' });
  });

  app.use('/api/assistant', assistantRoutes);

  app.use(errorHandler);

  return app;
}
