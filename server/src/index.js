import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { authRouter } from './routes/auth.js';

const app = express();
const port = Number(process.env.PORT) || 4000;

if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI in server/.env');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in server/.env');
  process.exit(1);
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'plate-server' });
});

app.use('/auth', authRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');

app.listen(port, () => {
  console.log(`Plate API listening on http://localhost:${port}`);
});
