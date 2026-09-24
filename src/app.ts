import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// 1. Security Headers via Helmet
app.use(helmet());

// 2. CORS Policy Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : [])
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request jika origin terdaftar ATAU jika origin undefined (seperti Postman/mobile app)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation: Access denied'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);
// 3. Body Parser Limiter (Cegah Body Payload Bom/Overload)
app.use(express.json({ limit: '10kb' }));

// 4. Health Check Route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server Express + Prisma + MySQL active & secure! 🚀'
  });
});

// 5. API Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);

// 6. 404 Handler untuk Route Tidak Ditemukan
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint route not found'
  });
});

// 7. Global Error Handler (Cegah leak stack trace ke client)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server running securely on http://localhost:${PORT}`);
});

export default app;