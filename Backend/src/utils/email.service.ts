import nodemailer from 'nodemailer';
import { env } from '../config/env';

export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: env.EMAIL_HOST,
            port: env.EMAIL_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: env.EMAIL_USER,
                pass: env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    private getOtpTemplate(name: string, otp: string, purpose: string): string {
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
                    <h1>Sovir Technologies<br>Training & Skilling Program</h1>
                </div>
                <div class="content">
                    <div class="welcome-text">Dear ${name},</div>
                    
                    <div class="message-body">
                        <p>Welcome to the <strong>Sovir Technologies Training and Skilling Program</strong>.</p>
                        
                        <p>We are delighted to have you with us. As requested, here is your One-Time Password (OTP) for <strong>${purpose}</strong>.</p>
                        
                        <div class="otp-box">${otp}</div>
                        
                        <p>This OTP is valid for <strong>3 minutes</strong>. Please do not share this code with anyone.</p>
                        
                        <p>All further information, updates, and important announcements will be shared through your registered login email ID. Kindly check your email regularly to stay informed.</p>

                        <p style="margin-top: 30px;">Once again, thank you for choosing Sovir Technologies as your skilling partner.</p>
                        
                        <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                            Warm regards,<br>
                            <strong>Sovir Technologies Team</strong>
                        </p>
                    </div>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} Sovir Technologies LLP. All rights reserved.<br>
                    <a href="https://sovirtechnologies.in" style="color: #666; text-decoration: none;">www.sovirtechnologies.in</a>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    public async sendOtp(to: string, otp: string, name: string = 'Participant', purpose: string = 'Verification'): Promise<void> {
        const htmlContent = this.getOtpTemplate(name, otp, purpose);

        const mailOptions = {
            from: `"Sovir Technologies" <${env.EMAIL_USER}>`,
            to,
            subject: `${purpose} OTP - Sovir Technologies`,
            text: `Dear ${name},\n\nYour OTP for ${purpose} is: ${otp}. It is valid for 3 minutes.\n\nWarm regards,\nSovir Technologies Team`,
            html: htmlContent,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Email service failed');
        }
    }



    public async sendEnrollmentEmail(
        to: string,
        name: string,
        courseTitle: string,
        status: 'PENDING' | 'APPROVED'
    ): Promise<void> {

        const isApproved = status === 'APPROVED';
        const dashboardLink = "https://training.sovirtechnologies.in/student-dashboard";

        const subject = isApproved
            ? `Enrollment Approved - ${courseTitle}`
            : `Enrollment Request Received - ${courseTitle}`;

        // Updated content based on user request - used for both pending/approved for now as general welcome, 
        // but keeping the logic if approved specific action is needed.
        // The user provided text is a "Welcome" message.

        const actionButton = isApproved
            ? `
            <a href="${dashboardLink}" style="display:inline-block; background-color:#d6b161; color:#0a192f; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; margin-top:20px;">
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
                    <h1>Sovir Technologies<br>Training & Skilling Program</h1>
                </div>
                <div class="content">
                    <div class="welcome-text">Dear ${name},</div>
                    
                    <div class="message-body">
                        <p>Welcome to the <span class="highlight">Sovir Technologies Training and Skilling Program</span>.</p>
                        
                        <p>We are delighted to have you with us. Our program is designed and delivered by industry-specific professional trainers, ensuring practical knowledge and real-world skill development.</p>
                        
                        <p>All further information, updates, and important announcements will be shared through your registered login email ID. Kindly check your email regularly to stay informed.</p>
                        
                        ${actionButton}

                        <p style="margin-top: 30px;">Once again, thank you for choosing Sovir Technologies as your skilling partner. We wish you a successful and enriching learning journey with us.</p>
                        
                        <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                            Warm regards,<br>
                            <strong>Sovir Technologies Team</strong>
                        </p>
                    </div>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} Sovir Technologies LLP. All rights reserved.<br>
                    <a href="https://sovirtechnologies.in" style="color: #666; text-decoration: none;">www.sovirtechnologies.in</a>
                </div>
            </div>
        </body>
        </html>
        `;

        const mailOptions = {
            from: `"Sovir Technologies" <${env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent,
            text: `Dear ${name},\n\nWelcome to Sovir Technologies Training and Skilling Program.\n\nWe are delighted to have you with us. Our program is designed and delivered by industry-specific professional trainers, ensuring practical knowledge and real-world skill development.\n\nAll further information, updates, and important announcements will be shared through your registered login email ID. Kindly check your email regularly to stay informed.\n\nOnce again, thank you for choosing Sovir Technologies as your skilling partner. We wish you a successful and enriching learning journey with us.\n\nWarm regards,\nSovir Technologies Team`
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending enrollment email:', error);
        }
    }

    public async forwardContactMessage(data: { name: string; email: string; subject: string; message: string }): Promise<void> {
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
            from: `"Contact Form" <${env.EMAIL_USER}>`,
            replyTo: data.email,
            to,
            subject,
            html: htmlContent,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error forwarding contact email:', error);
        }
    }

    public async sendContactAutoReply(to: string): Promise<void> {
        const subject = "Thank you for contacting Sovir Technologies LLP";
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

                <p>Greetings from Sovir Technologies LLP.</p>

                <p>Thank you for reaching out to us. We appreciate your interest in our organization. Our team of experts will review your details and get in touch with you shortly to discuss your requirements.</p>

                <p>You may share your profile with us for any service requirements, collaboration opportunities, or strategic partnerships. We look forward to exploring potential avenues of mutual growth and cooperation.</p>

                <p>Thank you for connecting with Sovir Technologies LLP.</p>

                <div class="footer">
                    <p>Yours sincerely,<br>
                    <strong>Sovir Technologies LLP</strong></p>
                </div>
            </div>
        </body>
        </html>
        `;

        const mailOptions = {
            from: `"Sovir Technologies" <${env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending auto-reply email:', error);
        }
    }
    public async sendTrialEmail(to: string, name: string): Promise<void> {
        const subject = "Welcome to Sovir Technologies Training & Skilling Program";
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
                    <h1>Sovir Technologies<br>Training & Skilling Program</h1>
                </div>
                <div class="content">
                    <div class="welcome-text">Dear ${name},</div>
                    
                    <div class="message-body">
                        <p>Welcome to the <span class="highlight">Sovir Technologies Training and Skilling Program</span>.</p>
                        
                        <p>We are delighted to have you with us. Our program is designed and delivered by industry-specific professional trainers, ensuring practical knowledge and real-world skill development.</p>
                        
                        <p>All further information, updates, and important announcements will be shared through your registered login email ID. Kindly check your email regularly to stay informed.</p>
                        
                        <p style="margin-top: 30px;">Once again, thank you for choosing Sovir Technologies as your skilling partner. We wish you a successful and enriching learning journey with us.</p>
                        
                        <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                            Warm regards,<br>
                            <strong>Sovir Technologies Team</strong>
                        </p>
                    </div>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} Sovir Technologies LLP. All rights reserved.<br>
                    <a href="https://sovirtechnologies.in" style="color: #666; text-decoration: none;">www.sovirtechnologies.in</a>
                </div>
            </div>
        </body>
        </html>
        `;

        const mailOptions = {
            from: `"Sovir Technologies" <${env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent,
            text: `Dear ${name},\n\nWelcome to Sovir Technologies Training and Skilling Program.\n\nWe are delighted to have you with us. Our program is designed and delivered by industry-specific professional trainers, ensuring practical knowledge and real-world skill development.\n\nAll further information, updates, and important announcements will be shared through your registered login email ID. Kindly check your email regularly to stay informed.\n\nOnce again, thank you for choosing Sovir Technologies as your skilling partner. We wish you a successful and enriching learning journey with us.\n\nWarm regards,\nSovir Technologies Team`
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending trial email:', error);
        }
    }
}
