import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db/index.js';
import authRouter   from './routes/auth.js';
import topicsRouter  from './routes/topics.js';
import lessonsRouter from './routes/lessons.js';

const PORT = process.env.PORT ?? 3000;
const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',   authRouter);
app.use('/api/topics',  topicsRouter);
app.use('/api/lessons', lessonsRouter);

async function start() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT NOW() AS time');
    console.log(`PostgreSQL connected — server time: ${rows[0].time}`);
  } finally {
    client.release();
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Startup error:', err.message);
  process.exit(1);
});
