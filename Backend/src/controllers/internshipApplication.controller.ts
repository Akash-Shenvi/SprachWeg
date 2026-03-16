import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import InternshipApplication from '../models/internshipApplication.model';

const fileServeRoot = '/home/sovirtraining/file_serve';
const adminDecisionStatuses = ['accepted', 'rejected'] as const;

const toStoredResumeUrl = (filename: string) => `/uploads/internship_resumes/${filename}`;

const removeStoredResume = (resumeUrl?: string) => {
    if (!resumeUrl) return;

    const relativePath = resumeUrl.replace('/uploads/', '');
    const absolutePath = path.join(fileServeRoot, relativePath);

    if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
    }
};

export const submitInternshipApplication = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to submit an internship application.' });
        }

        if ((req as any).fileValidationError) {
            return res.status(400).json({ message: (req as any).fileValidationError });
        }

        const {
            internshipTitle,
            firstName,
            lastName,
            dob,
            email,
            whatsapp,
            college,
            registration,
            department,
            semester,
            passingYear,
            address,
            source,
        } = req.body;

        const requiredFields = {
            internshipTitle,
            firstName,
            lastName,
            dob,
            email,
            whatsapp,
            college,
            registration,
            department,
            semester,
            passingYear,
            address,
            source,
        };

        const missingField = Object.entries(requiredFields).find(([, value]) => !String(value ?? '').trim());
        if (missingField) {
            return res.status(400).json({ message: `${missingField[0]} is required.` });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload your resume to continue.' });
        }

        const parsedDate = new Date(dob);
        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: 'Please provide a valid date of birth.' });
        }

        const applicationData = {
            userId: req.user._id,
            accountName: req.user.name,
            accountEmail: req.user.email,
            accountPhoneNumber: req.user.phoneNumber,
            internshipTitle: String(internshipTitle).trim(),
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            dateOfBirth: parsedDate,
            email: String(email).trim().toLowerCase(),
            whatsapp: String(whatsapp).trim(),
            college: String(college).trim(),
            registration: String(registration).trim(),
            department: String(department).trim(),
            semester: String(semester).trim(),
            passingYear: String(passingYear).trim(),
            address: String(address).trim(),
            source: String(source).trim(),
            resumeUrl: toStoredResumeUrl(req.file.filename),
            resumeOriginalName: req.file.originalname,
        };

        const existingApplication = await InternshipApplication.findOne({
            userId: req.user._id,
            internshipTitle: applicationData.internshipTitle,
        });

        if (existingApplication) {
            const previousResumeUrl = existingApplication.resumeUrl;

            existingApplication.set({
                ...applicationData,
                status: 'submitted',
            });

            await existingApplication.save();

            if (previousResumeUrl !== applicationData.resumeUrl) {
                removeStoredResume(previousResumeUrl);
            }

            return res.status(200).json({
                message: 'Internship application updated successfully.',
                application: existingApplication,
            });
        }

        const application = await InternshipApplication.create(applicationData);

        return res.status(201).json({
            message: 'Internship application submitted successfully.',
            application,
        });
    } catch (error: any) {
        if (req.file) {
            removeStoredResume(toStoredResumeUrl(req.file.filename));
        }

        if (error?.code === 11000) {
            return res.status(409).json({ message: 'You have already applied for this internship.' });
        }

        console.error('Internship application submission error:', error);
        return res.status(500).json({ message: 'Failed to submit internship application.' });
    }
};

export const getMyInternshipApplications = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to view your internship applications.' });
        }

        const applications = await InternshipApplication.find({ userId: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({ applications });
    } catch (error) {
        console.error('Fetching internship applications failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship applications.' });
    }
};

export const getAllInternshipApplications = async (req: Request, res: Response) => {
    try {
        const applications = await InternshipApplication.find()
            .populate('userId', 'name email phoneNumber role avatar')
            .sort({ createdAt: -1 });

        return res.status(200).json({ applications });
    } catch (error) {
        console.error('Fetching all internship applications failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship applications.' });
    }
};

export const updateInternshipApplicationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const requestedStatus = String(req.body.status ?? '').trim().toLowerCase();

        if (!adminDecisionStatuses.includes(requestedStatus as (typeof adminDecisionStatuses)[number])) {
            return res.status(400).json({ message: 'Status must be accepted or rejected.' });
        }

        const application = await InternshipApplication.findById(id).populate('userId', 'name email phoneNumber role avatar');

        if (!application) {
            return res.status(404).json({ message: 'Internship application not found.' });
        }

        application.status = requestedStatus as (typeof adminDecisionStatuses)[number];
        await application.save();

        return res.status(200).json({
            message: `Internship application ${requestedStatus} successfully.`,
            application,
        });
    } catch (error) {
        console.error('Updating internship application status failed:', error);
        return res.status(500).json({ message: 'Failed to update internship application status.' });
    }
};
