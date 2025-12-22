import { Request, Response } from 'express';
import TrialRequest from '../models/trialRequest.model';


// Import EmailService
import { EmailService } from '../utils/email.service';

const emailService = new EmailService();

// Create a new trial request
export const createTrialRequest = async (req: Request, res: Response) => {
    try {
        const { fullName, email, phone, countryCode, interest, language, course, prepLevel, skillCourses, comments } = req.body;

        const newRequest = new TrialRequest({
            fullName,
            email,
            phone,
            countryCode,
            interest,
            language,
            course,
            prepLevel,
            skillCourses,
            comments
        });

        await newRequest.save();

        // Send Email Notification
        if (email) {
            await emailService.sendTrialEmail(email, fullName);
        }

        res.status(201).json({ message: 'Trial request submitted successfully', data: newRequest });
    } catch (error: any) {
        console.error('Error creating trial request:', error);
        res.status(500).json({ message: 'Failed to submit trial request', error: error.message });
    }
};

// Get all trial requests (Admin)
export const getTrialRequests = async (req: Request, res: Response) => {
    try {
        const requests = await TrialRequest.find().sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error: any) {
        console.error('Error fetching trial requests:', error);
        res.status(500).json({ message: 'Failed to fetch trial requests', error: error.message });
    }
};

// Delete a trial request (Admin)
export const deleteTrialRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await TrialRequest.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ message: 'Trial request not found' });
        }

        res.status(200).json({ message: 'Trial request deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting trial request:', error);
        res.status(500).json({ message: 'Failed to delete trial request', error: error.message });
    }
};
