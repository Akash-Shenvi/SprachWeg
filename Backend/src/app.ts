import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';

const app = express();

// Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow frontend origins
    credentials: true, // Allow cookies and credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());

import itemRoutes from './routes/item.routes';
import authRoutes from './routes/auth.routes';
import skillRoutes from './routes/skillCourse.routes';

// ... (middlewares)

// Routes
app.use('/uploads', express.static('uploads')); // Serve uploaded files
app.use('/api/items', itemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

export default app;
