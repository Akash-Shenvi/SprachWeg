import { Request, Response } from 'express';
import { Feedback } from '../models/feedback.model';

// @desc    Submit new feedback
// @route   POST /api/feedback
// @access  Public
export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, problem } = req.body;
        
        let imageUrl = '';
        if (req.file) {
            // Reconstruct logic consistent with upload middleware 
            // The upload middleware puts it in a specific folder, we store the relative path or filename
            imageUrl = `/materials/${req.file.filename}`;
        }

        if (!name || !email || !problem) {
            res.status(400).json({ success: false, message: 'Please provide all required fields (name, email, problem).' });
            return;
        }

        const newFeedback = await Feedback.create({
            name,
            email,
            problem,
            imageUrl
        });

        res.status(201).json({ success: true, message: 'Feedback submitted successfully', data: newFeedback });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ success: false, message: 'Failed to submit feedback' });
    }
};

// @desc    Get all feedback
// @route   GET /api/feedback
// @access  Private (Admin)
export const getAllFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: feedbacks.length, data: feedbacks });
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch feedbacks' });
    }
};

// @desc    Delete (Mark as Solved) feedback
// @route   DELETE /api/feedback/:id
// @access  Private (Admin)
export const markFeedbackAsSolved = async (req: Request, res: Response): Promise<void> => {
    try {
        const feedback = await Feedback.findById(req.params.id);

        if (!feedback) {
            res.status(404).json({ success: false, message: 'Feedback not found' });
            return;
        }

        await feedback.deleteOne();

        res.status(200).json({ success: true, message: 'Feedback marked as solved and deleted' });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ success: false, message: 'Failed to solve/delete feedback' });
    }
};
