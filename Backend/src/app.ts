import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';


const app = express();
app.set('trust proxy', true);

const captureRawBody = (req: express.Request, _res: express.Response, buf: Buffer) => {
    (req as any).rawBody = Buffer.from(buf);
};

const allowedOrigins = Array.from(
    new Set(
        [
            env.FRONTEND_BASE_URL,
            'https://training.sovirtechnologies.in',
        ]
            .map((value) => {
                try {
                    return new URL(value).origin;
                } catch {
                    return '';
                }
            })
            .filter(Boolean)
    )
);

// Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
    origin: allowedOrigins,
    credentials: true, // Allow cookies and credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ verify: captureRawBody }));
app.use(express.urlencoded({ extended: true, verify: captureRawBody }));

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

import studentRoutes from './routes/student.routes';
app.use('/api/admin', studentRoutes);

import chatRoutes from './routes/chat.routes';
app.use('/api/chat', chatRoutes);

import internshipApplicationRoutes from './routes/internshipApplication.routes';
app.use('/api/internship-applications', internshipApplicationRoutes);

import internshipListingRoutes from './routes/internshipListing.routes';
app.use('/api/internships', internshipListingRoutes);

import trainingCheckoutRoutes from './routes/trainingCheckout.routes';
app.use('/api/training-checkout', trainingCheckoutRoutes);

import webinarRoutes from './routes/webinar.routes';
app.use('/api/webinars', webinarRoutes);

import webinarRegistrationRoutes from './routes/webinarRegistration.routes';
app.use('/api/webinar-registrations', webinarRegistrationRoutes);

import paymentRoutes from './routes/payment.routes';
app.use('/api/payments', paymentRoutes);

import institutionRoutes from './routes/institution.routes';
app.use('/api/institutions', institutionRoutes);

import adminInstitutionRoutes from './routes/adminInstitution.routes';
app.use('/api/admin/institutions', adminInstitutionRoutes);

import trainerBatchRoutes from './routes/trainer.batch.routes';
app.use('/api/trainer-batches', trainerBatchRoutes);

import skillBatchRoutes from './routes/skill.batch.routes';
app.use('/api/skill-batches', skillBatchRoutes);

import notificationRoutes from './routes/notification.routes';
app.use('/api/notifications', notificationRoutes);

import pushRoutes from './routes/push.routes';
app.use('/api/push', pushRoutes);

export default app;
