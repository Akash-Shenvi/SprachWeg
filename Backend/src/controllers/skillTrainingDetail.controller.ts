import { Request, Response } from 'express';
import SkillTrainingDetail from '../models/skillTrainingDetail.model';
import SkillCourse from '../models/skillCourse.model';

// Create or Update Details for a specific course
export const createOrUpdateDetail = async (req: Request, res: Response) => {
    try {
        const { skillCourseId, deliveryMode, classTimings, fees, origin } = req.body;

        if (!skillCourseId) {
            return res.status(400).json({ message: 'skillCourseId is required' });
        }

        // Check if course exists
        const course = await SkillCourse.findById(skillCourseId);
        if (!course) {
            return res.status(404).json({ message: 'Skill Course not found' });
        }

        // Upsert: update if exists, insert if not
        const detail = await SkillTrainingDetail.findOneAndUpdate(
            { skillCourseId },
            { deliveryMode, classTimings, fees, origin },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json(detail);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating details', error: error.message });
    }
};

// Get details by Course ID
export const getDetailByCourseId = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;
        const detail = await SkillTrainingDetail.findOne({ skillCourseId: courseId });

        if (!detail) {
            // Optionally return default values if not found, or 404
            // Returning defaults to be safe if migration didn't run or new course added without details
            return res.status(200).json({
                skillCourseId: courseId,
                deliveryMode: 'On-site / Online / Hybrid',
                classTimings: 'Customized Schedule',
                fees: '₹28,000',
                origin: ''
            });
        }

        res.status(200).json(detail);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching details', error: error.message });
    }
};
