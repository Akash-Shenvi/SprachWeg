import express from 'express';
import cors from 'cors';
import helmet from 'helmet';


const app = express();

// Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
    origin: ['https://training.sovirtechnologies.in'], // Allow frontend origins
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
app.use('/api/uploads', express.static('/home/sovirtraining/file_serve')); // Serve uploaded files
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

import contactRoutes from './routes/contact.routes';
app.use('/api/contact', contactRoutes);

import trialRoutes from './routes/trialRequest.routes';
app.use('/api', trialRoutes);

import feedbackRoutes from './routes/feedback.routes';
app.use('/api/feedback', feedbackRoutes);

import fileLinkRoutes from './routes/fileLink.routes';
app.use('/api/admin/files', fileLinkRoutes);

export default app;
