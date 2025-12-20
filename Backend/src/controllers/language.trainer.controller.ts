import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import LanguageBatch from '../models/language.batch.model';
import LanguageMaterial from '../models/language.material.model';
import LanguageAnnouncement from '../models/language.announcement.model';
import LanguageClass from '../models/language.class.model';
import User from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { GoogleCalendarService } from '../services/google.calendar.service';

const googleService = new GoogleCalendarService();

// Get all batches assigned to the trainer
export const getTrainerBatches = async (req: AuthRequest, res: Response) => {
    try {
        const trainerId = req.user?._id;
        const batches = await LanguageBatch.find({ trainerId })
            .populate('students', 'name email')
            .populate({ path: 'materials' })
            .populate({ path: 'announcements' })
            .populate({ path: 'classes' });

        res.json(batches);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching batches', error });
    }
};

// Get all batches where the student is enrolled
export const getStudentBatches = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user?._id;
        const batches = await LanguageBatch.find({ students: studentId })
            .populate('trainerId', 'name')
            .populate({ path: 'materials' })
            .populate({ path: 'announcements' })
            .populate({ path: 'classes' });

        res.json(batches);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student batches', error });
    }
};

// Add Material to a Batch
export const addMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const { batchId, title, subtitle, description } = req.body;
        const trainerId = req.user?._id;
        let fileUrl = '';

        if (req.file) {
            // Store relative path so frontend can prepend API URL
            fileUrl = `/uploads/materials/${req.file.filename}`;
        }

        // Verify trainer owns the batch
        const batch = await LanguageBatch.findOne({ _id: batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to add material to this batch' });
        }

        const material = new LanguageMaterial({
            batchId,
            title,
            subtitle,
            description,
            fileUrl, // Can be empty string if optional
            uploadedBy: trainerId
        });

        await material.save();
        res.status(201).json(material);
    } catch (error) {
        console.error("Error adding material:", error);
        res.status(500).json({ message: 'Error adding material', error });
    }
};

// Add Announcement to a Batch
export const addAnnouncement = async (req: AuthRequest, res: Response) => {
    try {
        const { batchId, title, content } = req.body;
        const trainerId = req.user?._id;

        // Verify trainer owns the batch
        const batch = await LanguageBatch.findOne({ _id: batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to add announcement to this batch' });
        }

        const announcement = new LanguageAnnouncement({
            batchId,
            title,
            content,
            senderId: trainerId
        });

        await announcement.save();
        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'Error adding announcement', error });
    }
};

// Get specific batch details (for both Student and Trainer)
export const getBatchDetails = async (req: AuthRequest, res: Response) => {
    try {
        const { batchId } = req.params;
        const userId = req.user?._id;

        const batch = await LanguageBatch.findById(batchId)
            .populate('students', 'name email phoneNumber avatar germanLevel guardianName guardianPhone qualification dateOfBirth')
            .populate('materials')
            .populate('announcements')
            .populate('classes');



        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        // Check access: Must be Trainer of the batch OR a Student in the batch
        const isTrainer = batch.trainerId?.toString() === userId?.toString();
        const isStudent = batch.students.some((s: any) => s._id.toString() === userId?.toString() || s.toString() === userId?.toString());

        if (!isTrainer && !isStudent) {
            return res.status(403).json({ message: 'Not authorized to view this batch' });
        }


        // Explicitly map response to ensure all fields are sent
        const batchObj: any = batch.toObject();

        try {
            fs.appendFileSync(path.join(process.cwd(), 'controller_debug.log'), `\n\n--- Request at ${new Date().toISOString()} ---\n`);
            if (batch.students && batch.students.length > 0) {
                const firstStudent = batch.students[0] as any;
                fs.appendFileSync(path.join(process.cwd(), 'controller_debug.log'), `First Student Raw: ${JSON.stringify(firstStudent, null, 2)}\n`);
            } else {
                fs.appendFileSync(path.join(process.cwd(), 'controller_debug.log'), `No students found in batch\n`);
            }
        } catch (err) {
            console.error("Log error", err);
        }

        batchObj.students = batch.students.map((s: any) => ({
            _id: s._id,
            name: s.name,
            email: s.email,
            phoneNumber: s.phoneNumber,
            avatar: s.avatar,
            germanLevel: s.germanLevel,
            guardianName: s.guardianName,
            guardianPhone: s.guardianPhone,
            qualification: s.qualification,
            dateOfBirth: s.dateOfBirth,
            isProfileComplete: !!(s.phoneNumber && s.guardianName && s.guardianPhone && s.qualification)
        }));

        res.json(batchObj);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching batch details', error });
    }
};

// Delete Material
export const deleteMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const { materialId } = req.params;
        const trainerId = req.user?._id;

        const material = await LanguageMaterial.findById(materialId);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Verify trainer owns the batch
        const batch = await LanguageBatch.findOne({ _id: material.batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to delete this material' });
        }

        // Delete file from filesystem
        if (material.fileUrl) {
            try {
                // material.fileUrl is like "/uploads/materials/filename.ext"
                // Resolve path relative to process.cwd() (typically project root where package.json is)
                const relativePath = material.fileUrl.startsWith('/') ? material.fileUrl.slice(1) : material.fileUrl;
                const filePath = path.join(process.cwd(), relativePath);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);

                } else {
                    console.warn(`File not found for deletion: ${filePath}`);
                }
            } catch (err) {
                console.error("Error deleting physical file:", err);
                // Continue to delete record
            }
        }

        await LanguageMaterial.findByIdAndDelete(materialId);
        res.json({ message: 'Material deleted successfully' });
    } catch (error) {
        console.error("Error deleting material:", error);
        res.status(500).json({ message: 'Error deleting material', error });
    }
};

// Delete Announcement
export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
    try {
        const { announcementId } = req.params;
        const trainerId = req.user?._id;

        const announcement = await LanguageAnnouncement.findById(announcementId);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Verify trainer owns the batch
        const batch = await LanguageBatch.findOne({ _id: announcement.batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to delete this announcement' });
        }

        await LanguageAnnouncement.findByIdAndDelete(announcementId);
        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error("Error deleting announcement:", error);
        res.status(500).json({ message: 'Error deleting announcement', error });
    }
};

// Schedule a Class
export const scheduleClass = async (req: AuthRequest, res: Response) => {
    try {
        const { batchId, topic, startTime } = req.body; // Remove meetLink from req.body
        const trainerId = req.user?._id;

        // Verify trainer owns the batch
        const batch = await LanguageBatch.findOne({ _id: batchId, trainerId }).populate('students');
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to schedule class for this batch' });
        }

        // Check if trainer has connected Google Calendar
        const trainer = await User.findById(trainerId).select('+googleRefreshToken');
        let meetLink = '';
        let eventId = '';

        if (trainer?.googleRefreshToken) {
            try {
                googleService.setCredentials(trainer.googleRefreshToken);

                // Get student emails
                const attendeeEmails = (batch.students as any[]).map(s => s.email);
                // Also add trainer
                if (trainer.email) attendeeEmails.push(trainer.email);

                const event = await googleService.createMeeting(
                    `Class: ${topic}`,
                    `Live class for ${batch.courseTitle} - ${batch.name}`,
                    new Date(startTime),
                    60,
                    attendeeEmails
                );
                meetLink = event.meetLink;
                eventId = event.eventId;
            } catch (err) {
                console.error("Failed to create Google Meet event:", err);
                // Fallback or Error? unique choice.
                // If critical, return error. If optional, maybe let them paste or fail.
                // Assuming "automatic specific", if it fails, maybe return error telling them to reconnect.
                // But for robustness, let's allow fallback if we had a link input, but we are removing it.
                // Better to throw error so they know integration failed.
                return res.status(500).json({ message: 'Failed to create Google Meet event. Please reconnect Google Calendar.' });
            }
        } else {
            // If not connected, we can't auto-generate.
            // If manual link is allowed, we could check req.body.meetLink?
            // But requirement is "automatically created".
            // So we return error asking to connect.
            // HOWEVER, to keep existing functionality working if they passed a link manually (fallback):
            if (req.body.meetLink) {
                meetLink = req.body.meetLink;
            } else {
                return res.status(400).json({ message: 'Google Calendar not connected. Please connect or provide a link manually.' });
            }
        }

        const newClass = new LanguageClass({
            batchId,
            trainerId,
            topic,
            startTime,
            meetLink,
            eventId
        });

        await newClass.save();
        res.status(201).json(newClass);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error scheduling class', error });
    }
};

// Delete a Class
export const deleteClass = async (req: AuthRequest, res: Response) => {
    try {
        const { classId } = req.params;
        const trainerId = req.user?._id;

        const languageClass = await LanguageClass.findById(classId);
        if (!languageClass) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Verify trainer owns the batch
        const batch = await LanguageBatch.findOne({ _id: languageClass.batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to delete this class' });
        }

        // Delete from Google Calendar
        if (languageClass.eventId) {
            const trainer = await User.findById(trainerId).select('+googleRefreshToken');
            if (trainer?.googleRefreshToken) {
                googleService.setCredentials(trainer.googleRefreshToken);
                await googleService.deleteEvent(languageClass.eventId);
            }
        }

        await LanguageClass.findByIdAndDelete(classId);
        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting class', error });
    }
};

// End a Class
export const endClass = async (req: AuthRequest, res: Response) => {
    try {
        const { classId } = req.params;
        const trainerId = req.user?._id;

        const languageClass = await LanguageClass.findById(classId);
        if (!languageClass) {
            return res.status(404).json({ message: 'Class not found' });
        }

        if (languageClass.trainerId.toString() !== (trainerId || '').toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Optional: Delete event from Google Calendar so link becomes invalid
        // or just leave it. User decided they want "End Meet".
        // Deleting the event is the safest way to "kill" the link.
        if (languageClass.eventId) {
            const trainer = await User.findById(trainerId).select('+googleRefreshToken');
            if (trainer?.googleRefreshToken) {
                googleService.setCredentials(trainer.googleRefreshToken);
                await googleService.deleteEvent(languageClass.eventId);
            }
        }

        languageClass.status = 'completed';
        await languageClass.save();

        res.json({ message: 'Class ended successfully', class: languageClass });
    } catch (error) {
        res.status(500).json({ message: 'Error ending class', error });
    }
};

// Manually Update Attendance
export const updateAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { classId } = req.params;
        const { studentId, attended } = req.body;
        const trainerId = req.user?._id;

        const languageClass = await LanguageClass.findById(classId);
        if (!languageClass) {
            return res.status(404).json({ message: 'Class not found' });
        }

        if (languageClass.trainerId.toString() !== (trainerId || '').toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (attended) {
            // Add if not exists
            const exists = languageClass.attendees.some(a => a.studentId.toString() === studentId);
            if (!exists) {
                languageClass.attendees.push({ studentId, joinedAt: new Date() });
            }
        } else {
            // Remove
            languageClass.attendees = languageClass.attendees.filter(a => a.studentId.toString() !== studentId);
        }

        await languageClass.save();
        res.json({ message: 'Attendance updated', attendees: languageClass.attendees });
    } catch (error) {
        res.status(500).json({ message: 'Error updating attendance', error });
    }
};

// Join Class (Record Attendance)
export const joinClass = async (req: AuthRequest, res: Response) => {
    try {
        const { classId } = req.params;
        const studentId = req.user?._id;

        const languageClass = await LanguageClass.findById(classId);
        if (!languageClass) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Check if already joined
        const alreadyJoined = languageClass.attendees.some(a => a.studentId.toString() === studentId?.toString());

        if (!alreadyJoined && studentId) {
            languageClass.attendees.push({
                studentId: studentId as any,
                joinedAt: new Date()
            });
            await languageClass.save();
        }

        res.json({ message: 'Attendance recorded', link: languageClass.meetLink });
    } catch (error) {
        res.status(500).json({ message: 'Error joining class', error });
    }
};
