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
    origin: ['http://localhost:5173', 'http://localhost:3000', 'https://training.sovirtechnologies.in'], // Allow frontend origins
    credentials: true, // Allow cookies and credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());

import itemRoutes from './routes/item.routes';
import authRoutes from './routes/auth.routes';
import skillRoutes from './routes/skillCourse.routes';
import languageRoutes from './routes/languageCourse.routes';
import languageTrainingRoutes from './routes/language.training.routes';
import languageTrainerRoutes from './routes/language.trainer.routes';
// ... (middlewares)

import dashboardRoutes from './routes/dashboard.routes';
import enrollmentRoutes from './routes/enrollment.routes';

// Routes
app.use('/api/uploads', express.static('uploads')); // Serve uploaded files
app.use('/api/items', itemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/languages', languageRoutes);

app.use('/api/language-training', languageTrainingRoutes);

import skillTrainingDetailRoutes from './routes/skillTrainingDetail.routes';
app.use('/api/skill-training-details', skillTrainingDetailRoutes);
app.use('/api/language-trainer', languageTrainerRoutes);

export default app;
