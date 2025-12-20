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

    public async sendOtp(to: string, otp: string): Promise<void> {
        const mailOptions = {
            from: `"SprachWeg" <${env.EMAIL_USER}>`,
            to,
            subject: 'Your Verification OTP',
            text: `Your OTP is: ${otp}. It is valid for 3 minutes.`,
            html: `<p>Your OTP is: <b>${otp}</b>. It is valid for 3 minutes.</p>`,
        };

        try {
            await this.transporter.sendMail(mailOptions);

        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Email service failed');
        }
    }
}
