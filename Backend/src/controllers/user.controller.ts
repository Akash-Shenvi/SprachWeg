import { Request, Response } from 'express';
import User from '../models/user.model';

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { phoneNumber, guardianName, guardianPhone, qualification, dateOfBirth } = req.body;


        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (guardianName) user.guardianName = guardianName;
        if (guardianPhone) user.guardianPhone = guardianPhone;
        if (qualification) user.qualification = qualification;
        if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);

        await user.save();

        res.status(200).json({
            id: (user as any)._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isProfileComplete: (user as any).isProfileComplete,
            phoneNumber: user.phoneNumber,
            guardianName: user.guardianName,
            guardianPhone: user.guardianPhone,
            qualification: user.qualification,
            dateOfBirth: user.dateOfBirth
        });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

