"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// CORS Configuration
app.use((0, cors_1.default)({
    origin: ['https://training.sovirtechnologies.in'], // Allow frontend origins
    credentials: true, // Allow cookies and credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express_1.default.json({
    verify: (req, _res, buf) => {
        req.rawBody = Buffer.from(buf);
    },
}));
const item_routes_1 = __importDefault(require("./routes/item.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const skillCourse_routes_1 = __importDefault(require("./routes/skillCourse.routes"));
const languageCourse_routes_1 = __importDefault(require("./routes/languageCourse.routes"));
const language_training_routes_1 = __importDefault(require("./routes/language.training.routes"));
const language_trainer_routes_1 = __importDefault(require("./routes/language.trainer.routes"));
// ... (middlewares)
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const enrollment_routes_1 = __importDefault(require("./routes/enrollment.routes"));
// Routes
app.use('/api/uploads', express_1.default.static('/home/sovirtraining/file_serve')); // Serve uploaded files
app.use('/api/items', item_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/skills', skillCourse_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/enrollment', enrollment_routes_1.default);
app.use('/api/languages', languageCourse_routes_1.default);
app.use('/api/language-training', language_training_routes_1.default);
const skillTrainingDetail_routes_1 = __importDefault(require("./routes/skillTrainingDetail.routes"));
app.use('/api/skill-training-details', skillTrainingDetail_routes_1.default);
app.use('/api/language-trainer', language_trainer_routes_1.default);
const contact_routes_1 = __importDefault(require("./routes/contact.routes"));
app.use('/api/contact', contact_routes_1.default);
const trialRequest_routes_1 = __importDefault(require("./routes/trialRequest.routes"));
app.use('/api', trialRequest_routes_1.default);
const feedback_routes_1 = __importDefault(require("./routes/feedback.routes"));
app.use('/api/feedback', feedback_routes_1.default);
const fileLink_routes_1 = __importDefault(require("./routes/fileLink.routes"));
app.use('/api/admin/files', fileLink_routes_1.default);
const student_routes_1 = __importDefault(require("./routes/student.routes"));
app.use('/api/admin', student_routes_1.default);
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
app.use('/api/chat', chat_routes_1.default);
const internshipApplication_routes_1 = __importDefault(require("./routes/internshipApplication.routes"));
app.use('/api/internship-applications', internshipApplication_routes_1.default);
const internshipListing_routes_1 = __importDefault(require("./routes/internshipListing.routes"));
app.use('/api/internships', internshipListing_routes_1.default);
const trainingCheckout_routes_1 = __importDefault(require("./routes/trainingCheckout.routes"));
app.use('/api/training-checkout', trainingCheckout_routes_1.default);
const webinar_routes_1 = __importDefault(require("./routes/webinar.routes"));
app.use('/api/webinars', webinar_routes_1.default);
const webinarRegistration_routes_1 = __importDefault(require("./routes/webinarRegistration.routes"));
app.use('/api/webinar-registrations', webinarRegistration_routes_1.default);
const institution_routes_1 = __importDefault(require("./routes/institution.routes"));
app.use('/api/institutions', institution_routes_1.default);
const adminInstitution_routes_1 = __importDefault(require("./routes/adminInstitution.routes"));
app.use('/api/admin/institutions', adminInstitution_routes_1.default);
const skill_batch_routes_1 = __importDefault(require("./routes/skill.batch.routes"));
app.use('/api/skill-batches', skill_batch_routes_1.default);
exports.default = app;
