import { Request, Response } from 'express';
import TrialRequest from '../models/trialRequest.model';

// Create a new trial request
export const createTrialRequest = async (req: Request, res: Response) => {
    try {
        console.log('Received trial request body:', req.body); // DEBUG LOG
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
        console.log('Trial request saved successfully:', newRequest); // DEBUG LOG

        res.status(201).json({ message: 'Trial request submitted successfully', data: newRequest });
    } catch (error: any) {
        console.error('Error creating trial request:', error);
        res.status(500).json({ message: 'Failed to submit trial request', error: error.message });
    }
};

// Get all trial requests (Admin)
export const getTrialRequests = async (req: Request, res: Response) => {
    try {
        console.log('Fetching all trial requests...'); // DEBUG LOG
        const requests = await TrialRequest.find().sort({ createdAt: -1 });
        console.log(`Found ${requests.length} requests`); // DEBUG LOG
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
