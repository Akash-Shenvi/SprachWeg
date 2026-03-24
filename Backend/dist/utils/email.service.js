"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const frontendBaseUrl = String(env_1.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/+$/, '');
const frontendHostLabel = (() => {
    try {
        return new URL(frontendBaseUrl).host;
    }
    catch (_a) {
        return frontendBaseUrl;
    }
})();
const studentDashboardLink = `${frontendBaseUrl}/student-dashboard`;
const institutionDashboardLink = `${frontendBaseUrl}/institution-dashboard`;
const careersPageLink = `${frontendBaseUrl}/careers`;
const languageTrainingLink = `${frontendBaseUrl}/language-training`;
const skillTrainingLink = `${frontendBaseUrl}/skill-training`;
const formatInternshipMode = (mode) => {
    const normalizedMode = String(mode !== null && mode !== void 0 ? mode : '').trim().toLowerCase();
    if (normalizedMode === 'remote' || normalizedMode === 'online') {
        return 'Remote';
    }
    if (normalizedMode === 'hybrid') {
        return 'Hybrid';
    }
    if (normalizedMode === 'onsite' || normalizedMode === 'on-site' || normalizedMode === 'on site') {
        return 'Onsite';
    }
    return 'Not specified';
};
const formatCurrencyAmount = (amount, currency = 'INR') => {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
        return 'Not available';
    }
    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency,
            maximumFractionDigits: 2,
        }).format(amount);
    }
    catch (_a) {
        return `${currency} ${amount.toFixed(2)}`;
    }
};
const formatDateTime = (value) => {
    if (!value) {
        return 'Not available';
    }
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return 'Not available';
    }
    return parsedDate.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: env_1.env.EMAIL_HOST,
            port: env_1.env.EMAIL_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: env_1.env.EMAIL_USER,
                pass: env_1.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }
    getProgramEmailTemplate(options) {
        var _a;
        const infoSection = ((_a = options.infoRows) === null || _a === void 0 ? void 0 : _a.length)
            ? `
                <div class="info-card">
                    ${options.infoRows
                .map((row) => `
                                <div class="info-row">
                                    <span class="info-label">${row.label}</span>
                                    <span class="info-value">${row.value}</span>
                                </div>
                            `)
                .join('')}
                </div>
            `
            : '';
        const actionButton = options.actionButton
            ? `
                <div style="margin-top: 26px;">
                    <a href="${options.actionButton.href}" class="action-button">${options.actionButton.label}</a>
                </div>
            `
            : '';
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header {
                    background-color: #0a192f;
                    color: #ffffff;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    color: #d6b161;
                }
                .content {
                    padding: 40px 30px;
                    background-color: #ffffff;
                }
                .welcome-text {
                    font-size: 18px;
                    color: #0a192f;
                    font-weight: 600;
                    margin-bottom: 20px;
                }
                .message-body {
                    color: #555555;
                    font-size: 16px;
                }
                .info-card {
                    margin: 24px 0;
                    padding: 18px 20px;
                    border: 1px solid #e8edf3;
                    border-radius: 8px;
                    background-color: #f8fafc;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 8px 0;
                    border-bottom: 1px solid #e8edf3;
                }
                .info-row:last-child {
                    border-bottom: 0;
                }
                .info-label {
                    color: #6b7280;
                    font-size: 13px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                .info-value {
                    color: #0a192f;
                    font-size: 14px;
                    font-weight: 700;
                    text-align: right;
                }
                .action-button {
                    display: inline-block;
                    background-color: #d6b161;
                    color: #0a192f !important;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 700;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #888888;
                    border-top: 1px solid #eeeeee;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>SoVir Skilling & Training Center<br>Training & Skilling Program</h1>
                </div>
                <div class="content">
                    <div class="welcome-text">Dear ${options.name},</div>
                    <div class="message-body">
                        <p><strong>${options.title}</strong></p>
                        ${options.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('')}
                        ${infoSection}
                        ${actionButton}
                        <p style="margin-top: 32px; border-top: 1px solid #eee; padding-top: 20px;">
                            Warm regards,<br>
                            <strong>SoVir Skilling & Training Center Team</strong>
                        </p>
                    </div>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} SoVir Skilling & Training Center. All rights reserved.<br>
                    <a href="https://sovirtechnologies.in" style="color: #666; text-decoration: none;">www.sovirtechnologies.in</a>
                </div>
            </div>
        </body>
        </html>
        `;
    }
    getOtpTemplate(name, otp, purpose) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header {
                    background-color: #0a192f;
                    color: #ffffff;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    color: #d6b161;
                }
                .content {
                    padding: 40px 30px;
                    background-color: #ffffff;
                }
                .welcome-text {
                    font-size: 18px;
                    color: #0a192f;
                    font-weight: 600;
                    margin-bottom: 20px;
                }
                .message-body {
                    color: #555555;
                    font-size: 16px;
                }
                .otp-box {
                    background-color: #f0f4f8;
                    border: 2px dashed #0a192f;
                    color: #0a192f;
                    font-size: 24px;
                    font-weight: bold;
                    text-align: center;
                    padding: 15px;
                    margin: 20px 0;
                    letter-spacing: 5px;
                    border-radius: 6px;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #888888;
                    border-top: 1px solid #eeeeee;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>SoVir Skilling & Training Center</h1>
                </div>
                <div class="content">
                    <div class="welcome-text">Dear ${name},</div>
                    
                    <div class="message-body">
                        <p>Welcome to the <strong>SoVir Skilling & Training Center</strong>.</p>
                        
                        <p>We are delighted to have you with us. As requested, here is your One-Time Password (OTP) for <strong>${purpose}</strong>.</p>
                        
                        <div class="otp-box">${otp}</div>
                        
                        <p>This OTP is valid for <strong>3 minutes</strong>. Please do not share this code with anyone.</p>
                        
                        <p>All further information, updates, and important announcements will be shared through your registered login email ID. Kindly check your email regularly to stay informed.</p>

                        <p style="margin-top: 30px;">Once again, thank you for choosing SoVir Skilling & Training Center as your skilling partner.</p>
                        
                        <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                            Warm regards,<br>
                            <strong>SoVir Skilling & Training Center Team</strong>
                        </p>
                    </div>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} SoVir Skilling & Training Center. All rights reserved.<br>
                    <a href="${frontendBaseUrl}" style="color: #666; text-decoration: none;">${frontendHostLabel}</a>
                </div>
            </div>
        </body>
        </html>
        `;
    }
    sendOtp(to_1, otp_1) {
        return __awaiter(this, arguments, void 0, function* (to, otp, name = 'Participant', purpose = 'Verification') {
            const htmlContent = this.getOtpTemplate(name, otp, purpose);
            const mailOptions = {
                from: `"SoVir Skilling & Training Center" <${env_1.env.EMAIL_USER}>`,
                to,
                subject: `${purpose} OTP - SoVir Skilling & Training Center`,
                text: `Dear ${name},\n\nYour OTP for ${purpose} is: ${otp}. It is valid for 3 minutes.\n\nWarm regards,\nSoVir Skilling & Training Center Team`,
                html: htmlContent,
            };
            try {
                yield this.transporter.sendMail(mailOptions);
            }
            catch (error) {
                console.error('Error sending email:', error);
                throw new Error('Email service failed');
            }
        });
    }
    sendEnrollmentEmail(to, name, courseTitle, status, paymentDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            const isApproved = status === 'APPROVED';
            const hasPaymentDetails = !!((paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.amount) !== undefined
                || (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentMethod)
                || (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.transactionId)
                || (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentId));
            if (hasPaymentDetails) {
                const paymentRows = [
                    { label: 'Payment Status', value: (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentStatus) || 'Paid' },
                    { label: 'Amount', value: formatCurrencyAmount(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.amount, (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.currency) || 'INR') },
                    { label: 'Payment Method', value: (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentMethod) || 'Not available' },
                    { label: 'Transaction ID', value: (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.transactionId) || 'Not available' },
                    { label: 'Payment ID', value: (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentId) || 'Not available' },
                    { label: 'Bank Reference Number', value: (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.bankReferenceNumber) || 'Not available' },
                    { label: 'Paid At', value: formatDateTime(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paidAt) },
                ];
                const subject = isApproved
                    ? `Enrollment Approved and Payment Confirmed - ${courseTitle}`
                    : `Enrollment Request and Payment Received - ${courseTitle}`;
                const html = this.getProgramEmailTemplate({
                    name,
                    title: isApproved
                        ? 'Your enrollment has been approved and your payment is confirmed.'
                        : 'Your enrollment request and payment have been received successfully.',
                    paragraphs: isApproved
                        ? [
                            `We are pleased to confirm that your enrollment for <strong>${courseTitle}</strong> has been approved.`,
                            'Your payment has been recorded successfully, and the transaction details are included below for your records.',
                            'You can now continue through your student dashboard and keep checking your registered email for class schedules and updates from our admissions team.',
                        ]
                        : [
                            `We have successfully received your enrollment request for <strong>${courseTitle}</strong>.`,
                            'Your payment has been confirmed successfully, and the transaction details are included below for your records.',
                            'Our admissions team will review your request and contact you through your registered email with the next updates.',
                        ],
                    infoRows: [
                        { label: 'Course', value: courseTitle },
                        { label: 'Status', value: isApproved ? 'Approved' : 'Pending Approval' },
                        ...paymentRows,
                    ],
                    actionButton: {
                        label: 'Open Student Dashboard',
                        href: studentDashboardLink,
                    },
                });
                const mailOptions = {
                    from: `" SoVir Skilling & Training Center" <${env_1.env.EMAIL_USER}>`,
                    to,
                    subject,
                    html,
                    text: isApproved
                        ? `Dear ${name},\n\nYour enrollment for ${courseTitle} has been approved and your payment is confirmed.\nStatus: Approved\nPayment Status: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentStatus) || 'Paid'}\nAmount: ${formatCurrencyAmount(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.amount, (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.currency) || 'INR')}\nPayment Method: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentMethod) || 'Not available'}\nTransaction ID: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.transactionId) || 'Not available'}\nPayment ID: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentId) || 'Not available'}\nBank Reference Number: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.bankReferenceNumber) || 'Not available'}\nPaid At: ${formatDateTime(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paidAt)}\n\nStudent Dashboard: ${studentDashboardLink}\n\nWarm regards,\nSoVir Skilling & Training Center Team`
                        : `Dear ${name},\n\nWe have received your enrollment request and payment for ${courseTitle} successfully.\nStatus: Pending Approval\nPayment Status: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentStatus) || 'Paid'}\nAmount: ${formatCurrencyAmount(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.amount, (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.currency) || 'INR')}\nPayment Method: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentMethod) || 'Not available'}\nTransaction ID: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.transactionId) || 'Not available'}\nPayment ID: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentId) || 'Not available'}\nBank Reference Number: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.bankReferenceNumber) || 'Not available'}\nPaid At: ${formatDateTime(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paidAt)}\n\nOur admissions team will contact you with the next updates.\nStudent Dashboard: ${studentDashboardLink}\n\nWarm regards,\nSoVir Skilling & Training Center Team`,
                };
                try {
                    yield this.transporter.sendMail(mailOptions);
                }
                catch (error) {
                    console.error('Error sending enrollment payment email:', error);
                }
                return;
            }
            const subject = isApproved
                ? `Enrollment Approved - ${courseTitle}`
                : `Enrollment Request Received - ${courseTitle}`;
            // Updated content based on user request - used for both pending/approved for now as general welcome, 
            // but keeping the logic if approved specific action is needed.
            // The user provided text is a "Welcome" message.
            const actionButton = isApproved
                ? `
            <a href="${studentDashboardLink}" style="display:inline-block; background-color:#d6b161; color:#0a192f; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; margin-top:20px;">
                Access Student Dashboard
            </a>
            `
                : '';
            const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header {
                    background-color: #0a192f;
                    color: #ffffff;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    color: #d6b161;
                }
                .content {
                    padding: 40px 30px;
                    background-color: #ffffff;
                }
                .welcome-text {
                    font-size: 18px;
                    color: #0a192f;
                    font-weight: 600;
                    margin-bottom: 20px;
                }
                .message-body {
                    color: #555555;
                    font-size: 16px;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #888888;
                    border-top: 1px solid #eeeeee;
                }
                .highlight {
                    color: #0a192f;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>SoVir Skilling & Training Center</h1>
                </div>
                <div class="content">
                    <div class="welcome-text">Dear ${name},</div>
                    
                    <div class="message-body">
                        <p>Welcome to the <span class="highlight">SoVir Skilling & Training Center</span>.</p>
                        
                        <p>We are delighted to have you with us. Our program is designed and delivered by industry-specific professional trainers, ensuring practical knowledge and real-world skill development.</p>
                        
                        <p>All further information, updates, and important announcements will be shared through your registered login email ID. Kindly check your email regularly to stay informed.</p>
                        
                        ${actionButton}

                        <p style="margin-top: 30px;">Once again, thank you for choosing  SoVir Skilling & Training Center as your skilling partner. We wish you a successful and enriching learning journey with us.</p>
                        
                        <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                            Warm regards,<br>
                            <strong>SoVir Skilling & Training Center Team</strong>
                        </p>
                    </div>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} SoVir Skilling & Training Center. All rights reserved.<br>
                    <a href="https://sovirtechnologies.in" style="color: #666; text-decoration: none;">www.sovirtechnologies.in</a>
                </div>
            </div>
        </body>
        </html>
        `;
            const mailOptions = {
                from: `"SoVir Skilling & Training Center" <${env_1.env.EMAIL_USER}>`,
                to,
                subject,
                html: htmlContent,
                text: `Dear ${name},\n\nWelcome to SoVir Skilling & Training Center.\n\nWe are delighted to have you with us. Our program is designed and delivered by industry-specific professional trainers, ensuring practical knowledge and real-world skill development.\n\nAll further information, updates, and important announcements will be shared through your registered login email ID. Kindly check your email regularly to stay informed.\n\nOnce again, thank you for choosing SoVir Skilling & Training Center as your skilling partner. We wish you a successful and enriching learning journey with us.\n\nWarm regards,\nSoVir Skilling & Training Center Team`
            };
            try {
                yield this.transporter.sendMail(mailOptions);
            }
            catch (error) {
                console.error('Error sending enrollment email:', error);
            }
        });
    }
    sendInstitutionSubmissionDecisionEmail(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const isApproved = params.status === 'APPROVED';
            const subject = isApproved
                ? `Institution Enrollment Request Approved - ${params.courseTitle} ${params.levelName}`
                : `Institution Enrollment Request Rejected - ${params.courseTitle} ${params.levelName}`;
            const html = this.getProgramEmailTemplate({
                name: params.institutionName,
                title: isApproved
                    ? 'Your institution enrollment request has been approved.'
                    : 'Your institution enrollment request has been rejected.',
                paragraphs: isApproved
                    ? [
                        `We have approved your institution submission for <strong>${params.courseTitle} - ${params.levelName}</strong>.`,
                        `All ${params.studentCount} student account(s) in this request are now active and enrolled in the selected course level.`,
                        'Please coordinate directly with your students to share the credentials you created for them.',
                    ]
                    : [
                        `We reviewed your institution submission for <strong>${params.courseTitle} - ${params.levelName}</strong>.`,
                        'This request was not approved, so no student accounts or course enrollments were created from this submission.',
                        'Please review your submission and create a new request if you would like to try again.',
                    ],
                infoRows: [
                    { label: 'Language', value: 'German' },
                    { label: 'Course', value: params.courseTitle },
                    { label: 'Level', value: params.levelName },
                    { label: 'Students', value: String(params.studentCount) },
                    { label: 'Decision', value: isApproved ? 'Approved' : 'Rejected' },
                ],
                actionButton: {
                    label: 'Open Institution Portal',
                    href: institutionDashboardLink,
                },
            });
            try {
                yield this.transporter.sendMail({
                    from: `"SoVir Skilling & Training Center" <${env_1.env.EMAIL_USER}>`,
                    to: params.to,
                    subject,
                    html,
                    text: `Dear ${params.institutionName},\n\nYour institution request for ${params.courseTitle} - ${params.levelName} has been ${isApproved ? 'approved' : 'rejected'}.\nStudents in request: ${params.studentCount}\n\nInstitution Portal: ${institutionDashboardLink}\n\nWarm regards,\nSoVir Skilling & Training Center Team`,
                });
                return true;
            }
            catch (error) {
                console.error('Error sending institution decision email:', error);
                return false;
            }
        });
    }
    sendInstitutionStudentWelcomeEmail(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = this.getProgramEmailTemplate({
                name: params.studentName,
                title: 'Your student account is now active.',
                paragraphs: [
                    `A student account has been created for you and enrolled in <strong>${params.courseTitle} - ${params.levelName}</strong>.`,
                    'Your institution has already set the password for this account. Please contact your institution coordinator directly if you need the password or login assistance.',
                    'You can now sign in to the student portal to access your course once you have your credentials.',
                ],
                infoRows: [
                    { label: 'Course', value: params.courseTitle },
                    { label: 'Level', value: params.levelName },
                    { label: 'Portal', value: 'Student Dashboard' },
                ],
                actionButton: {
                    label: 'Open Student Portal',
                    href: studentDashboardLink,
                },
            });
            try {
                yield this.transporter.sendMail({
                    from: `"SoVir Skilling & Training Center" <${env_1.env.EMAIL_USER}>`,
                    to: params.to,
                    subject: `Student Account Activated - ${params.courseTitle} ${params.levelName}`,
                    html,
                    text: `Dear ${params.studentName},\n\nYour student account has been created and enrolled in ${params.courseTitle} - ${params.levelName}.\nYour institution has the password for this account. Please contact them if you need your login credentials.\n\nStudent Dashboard: ${studentDashboardLink}\n\nWarm regards,\nSoVir Skilling & Training Center Team`,
                });
                return true;
            }
            catch (error) {
                console.error('Error sending institution student welcome email:', error);
                return false;
            }
        });
    }
    sendTrainingPaymentFailureEmail(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const fallbackRetryUrl = params.trainingType === 'language'
                ? languageTrainingLink
                : skillTrainingLink;
            const retryUrl = params.retryUrl || fallbackRetryUrl;
            const normalizedStatus = String((_a = params.status) !== null && _a !== void 0 ? _a : '').trim().toLowerCase();
            const isCancelled = normalizedStatus === 'cancelled';
            const trainingTypeLabel = params.trainingType === 'language' ? 'Language Training' : 'Skill Training';
            const displayCourseTitle = params.levelName
                ? `${params.courseTitle} - ${params.levelName}`
                : params.courseTitle;
            const amountLabel = formatCurrencyAmount(params.amount, params.currency || 'INR');
            const subject = isCancelled
                ? `Training Payment Not Completed - ${displayCourseTitle}`
                : `Training Payment Failed - ${displayCourseTitle}`;
            const html = this.getProgramEmailTemplate({
                name: params.name,
                title: isCancelled
                    ? 'Your training checkout was not completed.'
                    : 'We could not complete your training payment.',
                paragraphs: [
                    `We were unable to complete the payment step for <strong>${displayCourseTitle}</strong>.`,
                    isCancelled
                        ? 'The checkout was closed before payment could be completed. You can return to the course page and try again whenever you are ready.'
                        : 'Your enrollment request was not submitted because the payment did not complete successfully. You can try the checkout again from the course page.',
                    'If the amount was debited from your account but the enrollment request was not submitted, please contact our support team with your payment details so we can assist you quickly.',
                ],
                infoRows: [
                    { label: 'Training', value: displayCourseTitle },
                    { label: 'Program Type', value: trainingTypeLabel },
                    { label: 'Amount', value: amountLabel },
                    { label: 'Status', value: isCancelled ? 'Not Completed' : 'Payment Failed' },
                    { label: 'Gateway Status', value: params.paymentStatus || 'Not available' },
                    { label: 'Payment Method', value: params.paymentMethod || 'Not available' },
                    { label: 'Reason', value: params.failureReason || 'Payment could not be completed.' },
                ],
                actionButton: {
                    label: 'Try Again',
                    href: retryUrl,
                },
            });
            const mailOptions = {
                from: `"SoVir Skilling & Training Center" <${env_1.env.EMAIL_USER}>`,
                to: params.to,
                subject,
                html,
                text: `Dear ${params.name},\n\nWe were unable to complete the payment step for ${displayCourseTitle}.\nProgram Type: ${trainingTypeLabel}\nAmount: ${amountLabel}\nStatus: ${isCancelled ? 'Not Completed' : 'Payment Failed'}\nGateway Status: ${params.paymentStatus || 'Not available'}\nPayment Method: ${params.paymentMethod || 'Not available'}\nReason: ${params.failureReason || 'Payment could not be completed.'}\n\nNo enrollment request was submitted. Please try again from the course page.\nStudent Dashboard: ${studentDashboardLink}\nRetry Link: ${retryUrl}\n\nWarm regards,\nSoVir Skilling & Training Center Team`,
            };
            try {
                yield this.transporter.sendMail(mailOptions);
                return true;
            }
            catch (error) {
                console.error('Error sending training payment failure email:', error);
                return false;
            }
        });
    }
    forwardContactMessage(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const to = "sovirtechnologies@gmail.com";
            const subject = `New Contact Form Submission: ${data.subject}`;
            const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: sans-serif; }
                .container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                .label { font-weight: bold; color: #555; }
                .value { margin-bottom: 15px; color: #333; }
                .message-box { background: #f9f9f9; padding: 15px; border-left: 4px solid #d6b161; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>New Contact Message</h2>
                <div class="label">Name:</div>
                <div class="value">${data.name}</div>
                
                <div class="label">Email:</div>
                <div class="value">${data.email}</div>
                
                <div class="label">Subject:</div>
                <div class="value">${data.subject}</div>
                
                <div class="label">Message:</div>
                <div class="message-box">${data.message.replace(/\n/g, '<br>')}</div>
            </div>
        </body>
        </html>
        `;
            const mailOptions = {
                from: `"Contact Form" <${env_1.env.EMAIL_USER}>`,
                replyTo: data.email,
                to,
                subject,
                html: htmlContent,
            };
            try {
                yield this.transporter.sendMail(mailOptions);
            }
            catch (error) {
                console.error('Error forwarding contact email:', error);
            }
        });
    }
    sendContactAutoReply(to) {
        return __awaiter(this, void 0, void 0, function* () {
            const subject = "Thank you for contacting SoVir Skilling & Training Center";
            const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: sans-serif; line-height: 1.6; color: #333; }
                .container { padding: 20px; max-width: 600px; margin: 0 auto; }
                .footer { margin-top: 30px; font-size: 0.9em; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <p>Dear Sir/Madam,</p>

                <p>Greetings from SoVir Skilling & Training Center.</p>

                <p>Thank you for reaching out to us. We appreciate your interest in our organization. Our team of experts will review your details and get in touch with you shortly to discuss your requirements.</p>

                <p>You may share your profile with us for any service requirements, collaboration opportunities, or strategic partnerships. We look forward to exploring potential avenues of mutual growth and cooperation.</p>

                <p>Thank you for connecting with SoVir Skilling & Training Center.</p>

                <div class="footer">
                    <p>Yours sincerely,<br>
                    <strong>SoVir Skilling & Training Center</strong></p>
                </div>
            </div>
        </body>
        </html>
        `;
            const mailOptions = {
                from: `"SoVir Skilling & Training Center" <${env_1.env.EMAIL_USER}>`,
                to,
                subject,
                html: htmlContent,
            };
            try {
                yield this.transporter.sendMail(mailOptions);
            }
            catch (error) {
                console.error('Error sending auto-reply email:', error);
            }
        });
    }
    sendTrialEmail(to, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const subject = "Welcome to SoVir Skilling & Training Center Training & Skilling Program";
            const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header {
                    background-color: #0a192f;
                    color: #ffffff;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    color: #d6b161;
                }
                .content {
                    padding: 40px 30px;
                    background-color: #ffffff;
                }
                .welcome-text {
                    font-size: 18px;
                    color: #0a192f;
                    font-weight: 600;
                    margin-bottom: 20px;
                }
                .message-body {
                    color: #555555;
                    font-size: 16px;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #888888;
                    border-top: 1px solid #eeeeee;
                }
                .highlight {
                    color: #0a192f;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>SoVir Skilling & Training Center<br>Training & Skilling Program</h1>
                </div>
                <div class="content">
                    <div class="welcome-text">Dear ${name},</div>
                    
                    <div class="message-body">
                        <p>Welcome to the <span class="highlight">SoVir Skilling & Training Center</span>.</p>
                        
                        <p>We are delighted to have you with us. Our program is designed and delivered by industry-specific professional trainers, ensuring practical knowledge and real-world skill development.</p>
                        
                        <p>All further information, updates, and important announcements will be shared through your registered login email ID. Kindly check your email regularly to stay informed.</p>
                        
                        <p style="margin-top: 30px;">Once again, thank you for choosing SoVir Skilling & Training Center as your skilling partner. We wish you a successful and enriching learning journey with us.</p>
                        
                        <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                            Warm regards,<br>
                            <strong>SoVir Skilling & Training Center Team</strong>
                        </p>
                    </div>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} SoVir Skilling & Training Center. All rights reserved.<br>
                    <a href="https://sovirtechnologies.in" style="color: #666; text-decoration: none;">www.sovirtechnologies.in</a>
                </div>
            </div>
        </body>
        </html>
        `;
            const mailOptions = {
                from: `"SoVir Skilling & Training Center" <${env_1.env.EMAIL_USER}>`,
                to,
                subject,
                html: htmlContent,
                text: `Dear ${name},\n\nWelcome to SoVir Skilling & Training Center.\n\nWe are delighted to have you with us. Our program is designed and delivered by industry-specific professional trainers, ensuring practical knowledge and real-world skill development.\n\nAll further information, updates, and important announcements will be shared through your registered login email ID. Kindly check your email regularly to stay informed.\n\nOnce again, thank you for choosing SoVir Skilling & Training Center as your skilling partner. We wish you a successful and enriching learning journey with us.\n\nWarm regards,\nSoVir Skilling & Training Center Team`
            };
            try {
                yield this.transporter.sendMail(mailOptions);
            }
            catch (error) {
                console.error('Error sending trial email:', error);
            }
        });
    }
    sendInternshipApplicationEmail(to, name, internshipTitle, referenceCode, internshipMode, paymentDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            const formattedMode = formatInternshipMode(internshipMode);
            const hasPaymentDetails = !!((paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.amount) !== undefined
                || (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentMethod)
                || (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.transactionId)
                || (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentId));
            const subject = hasPaymentDetails
                ? `Internship Application and Payment Received - ${internshipTitle}`
                : `Internship Application Received - ${internshipTitle}`;
            const paymentRows = hasPaymentDetails
                ? [
                    { label: 'Payment Status', value: (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentStatus) || 'Paid' },
                    { label: 'Amount', value: formatCurrencyAmount(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.amount, (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.currency) || 'INR') },
                    { label: 'Payment Method', value: (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentMethod) || 'Not available' },
                    { label: 'Transaction ID', value: (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.transactionId) || 'Not available' },
                    { label: 'Payment ID', value: (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentId) || 'Not available' },
                    { label: 'Bank Reference Number', value: (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.bankReferenceNumber) || 'Not available' },
                    { label: 'Paid At', value: formatDateTime(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paidAt) },
                ]
                : [];
            const html = this.getProgramEmailTemplate({
                name,
                title: 'Thank you for applying for an internship with SoVir Skilling & Training Center.',
                paragraphs: [
                    `We have successfully received your application for the <strong>${internshipTitle}</strong> internship opportunity.`,
                    ...(hasPaymentDetails
                        ? ['Your payment has been confirmed successfully, and the transaction details are included below for your records.']
                        : []),
                    'Our team will review your profile and reach out to you through your registered email if your application moves to the next stage.',
                    'Please keep your reference ID safe for future communication and continue checking your email regularly for updates from our team.',
                ],
                infoRows: [
                    { label: 'Internship', value: internshipTitle },
                    { label: 'Mode', value: formattedMode },
                    { label: 'Reference ID', value: referenceCode },
                    { label: 'Status', value: 'Application Received' },
                    ...paymentRows,
                ],
                actionButton: {
                    label: 'Open Student Dashboard',
                    href: studentDashboardLink,
                },
            });
            const mailOptions = {
                from: `"SoVir Skilling & Training Center" <${env_1.env.EMAIL_USER}>`,
                to,
                subject,
                html,
                text: `Dear ${name},\n\nThank you for applying for the ${internshipTitle} internship at SoVir Skilling & Training Center.\n\nWe have received your application successfully.\nMode: ${formattedMode}\nReference ID: ${referenceCode}\nStatus: Application Received${hasPaymentDetails ? `\nPayment Status: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentStatus) || 'Paid'}\nAmount: ${formatCurrencyAmount(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.amount, (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.currency) || 'INR')}\nPayment Method: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentMethod) || 'Not available'}\nTransaction ID: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.transactionId) || 'Not available'}\nPayment ID: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paymentId) || 'Not available'}\nBank Reference Number: ${(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.bankReferenceNumber) || 'Not available'}\nPaid At: ${formatDateTime(paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.paidAt)}` : ''}\n\nOur team will review your profile and update you through your registered email.\n\nWarm regards,\nSoVir Skilling & Training Center Team`,
            };
            try {
                yield this.transporter.sendMail(mailOptions);
            }
            catch (error) {
                console.error('Error sending internship application email:', error);
            }
        });
    }
    sendInternshipStatusEmail(to, name, internshipTitle, referenceCode, internshipMode, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const isAccepted = status === 'accepted';
            const formattedMode = formatInternshipMode(internshipMode);
            const subject = isAccepted
                ? `Internship Application Accepted - ${internshipTitle}`
                : `Internship Application Update - ${internshipTitle}`;
            const html = this.getProgramEmailTemplate({
                name,
                title: isAccepted
                    ? 'Congratulations. Your internship application has been accepted.'
                    : 'Your internship application has been reviewed.',
                paragraphs: isAccepted
                    ? [
                        `We are pleased to inform you that your application for the <strong>${internshipTitle}</strong> internship has been accepted.`,
                        'Our team will share the next instructions and onboarding details with you through your registered email. Please keep checking your inbox regularly.',
                        'We look forward to having you as part of the SoVir Skilling & Training Center learning and skilling journey.',
                    ]
                    : [
                        `Thank you for applying for the <strong>${internshipTitle}</strong> internship at SoVir Skilling & Training Center.`,
                        'After careful review, we are unable to move forward with your application for this opportunity at this time.',
                        'We appreciate your interest in our programs and encourage you to apply again for future opportunities that match your profile.',
                    ],
                infoRows: [
                    { label: 'Internship', value: internshipTitle },
                    { label: 'Mode', value: formattedMode },
                    { label: 'Reference ID', value: referenceCode },
                    { label: 'Status', value: isAccepted ? 'Accepted' : 'Rejected' },
                ],
                actionButton: {
                    label: isAccepted ? 'Open Student Dashboard' : 'View Careers Page',
                    href: isAccepted ? studentDashboardLink : careersPageLink,
                },
            });
            const mailOptions = {
                from: `"SoVir Skilling & Training Center" <${env_1.env.EMAIL_USER}>`,
                to,
                subject,
                html,
                text: isAccepted
                    ? `Dear ${name},\n\nCongratulations. Your application for the ${internshipTitle} internship has been accepted.\nMode: ${formattedMode}\nReference ID: ${referenceCode}\n\nOur team will share the next steps with you soon.\n\nWarm regards,\nSoVir Skilling & Training Center Team`
                    : `Dear ${name},\n\nThank you for applying for the ${internshipTitle} internship at SoVir Skilling & Training Center.\nMode: ${formattedMode}\nReference ID: ${referenceCode}\n\nAfter review, we are unable to move forward with your application for this opportunity at this time.\n\nWe appreciate your interest and encourage you to apply again in the future.\n\nWarm regards,\nSoVir Skilling & Training Center Team`,
            };
            try {
                yield this.transporter.sendMail(mailOptions);
            }
            catch (error) {
                console.error('Error sending internship status email:', error);
            }
        });
    }
    sendInternshipPaymentFailureEmail(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const formattedMode = formatInternshipMode(params.internshipMode);
            const amountLabel = formatCurrencyAmount(params.amount, params.currency || 'INR');
            const normalizedStatus = String((_a = params.status) !== null && _a !== void 0 ? _a : '').trim().toLowerCase();
            const isCancelled = normalizedStatus === 'cancelled';
            const subject = isCancelled
                ? `Internship Payment Not Completed - ${params.internshipTitle}`
                : `Internship Payment Failed - ${params.internshipTitle}`;
            const html = this.getProgramEmailTemplate({
                name: params.name,
                title: isCancelled
                    ? 'Your internship checkout was not completed.'
                    : 'We could not complete your internship payment.',
                paragraphs: [
                    `We were unable to complete the payment step for the <strong>${params.internshipTitle}</strong> internship application.`,
                    isCancelled
                        ? 'The checkout was closed before payment could be completed. You can return to the internship page and try again whenever you are ready.'
                        : 'No internship application was submitted because the payment did not complete successfully. You can try the checkout again from the internship page.',
                    'If the amount was debited from your account but the application was not submitted, please contact our support team with your payment details so we can help you quickly.',
                ],
                infoRows: [
                    { label: 'Internship', value: params.internshipTitle },
                    { label: 'Mode', value: formattedMode },
                    { label: 'Amount', value: amountLabel },
                    { label: 'Status', value: isCancelled ? 'Not Completed' : 'Payment Failed' },
                    { label: 'Gateway Status', value: params.paymentStatus || 'Not available' },
                    { label: 'Payment Method', value: params.paymentMethod || 'Not available' },
                    { label: 'Reason', value: params.failureReason || 'Payment could not be completed.' },
                ],
                actionButton: {
                    label: 'Try Again',
                    href: careersPageLink,
                },
            });
            const mailOptions = {
                from: `"SoVir Skilling & Training Center" <${env_1.env.EMAIL_USER}>`,
                to: params.to,
                subject,
                html,
                text: `Dear ${params.name},\n\nWe were unable to complete the payment step for the ${params.internshipTitle} internship.\nMode: ${formattedMode}\nAmount: ${amountLabel}\nStatus: ${isCancelled ? 'Not Completed' : 'Payment Failed'}\nGateway Status: ${params.paymentStatus || 'Not available'}\nPayment Method: ${params.paymentMethod || 'Not available'}\nReason: ${params.failureReason || 'Payment could not be completed.'}\n\nNo internship application was submitted. Please return to the internship page and try again.\n\nStudent Dashboard: ${studentDashboardLink}\nCareers Page: ${careersPageLink}\n\nWarm regards,\nSoVir Skilling & Training Center Team`,
            };
            try {
                yield this.transporter.sendMail(mailOptions);
                return true;
            }
            catch (error) {
                console.error('Error sending internship payment failure email:', error);
                return false;
            }
        });
    }
}
exports.EmailService = EmailService;
