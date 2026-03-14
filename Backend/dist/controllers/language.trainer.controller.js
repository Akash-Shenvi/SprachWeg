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
exports.getBatchClasses = exports.getBatchStudents = exports.getBatchMaterials = exports.getBatchAnnouncements = exports.joinClass = exports.updateAttendance = exports.endClass = exports.deleteClass = exports.scheduleClass = exports.deleteAnnouncement = exports.deleteMaterial = exports.getBatchDetails = exports.addAnnouncement = exports.addMaterial = exports.getStudentBatches = exports.getTrainerBatches = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const language_batch_model_1 = __importDefault(require("../models/language.batch.model"));
const language_material_model_1 = __importDefault(require("../models/language.material.model"));
const language_announcement_model_1 = __importDefault(require("../models/language.announcement.model"));
const language_class_model_1 = __importDefault(require("../models/language.class.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const google_calendar_service_1 = require("../services/google.calendar.service");
const googleService = new google_calendar_service_1.GoogleCalendarService();
// Get all batches assigned to the trainer
const getTrainerBatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const trainerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const batches = yield language_batch_model_1.default.find({ trainerId })
            .populate('students', 'name email')
            .populate({ path: 'materials' })
            .populate({ path: 'announcements' })
            .populate({ path: 'classes' });
        res.json(batches);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching batches', error });
    }
});
exports.getTrainerBatches = getTrainerBatches;
// Get all batches where the student is enrolled
const getStudentBatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const studentId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const batches = yield language_batch_model_1.default.find({ students: studentId })
            .populate('trainerId', 'name')
            .populate({ path: 'materials' })
            .populate({ path: 'announcements' })
            .populate({ path: 'classes' });
        res.json(batches);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching student batches', error });
    }
});
exports.getStudentBatches = getStudentBatches;
// Add Material to a Batch
const addMaterial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { batchId, title, subtitle, description } = req.body;
        const trainerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        let fileUrl = '';
        if (req.file) {
            // Store relative path so frontend can prepend API URL
            fileUrl = `/uploads/materials/${req.file.filename}`;
        }
        // Verify trainer owns the batch
        const batch = yield language_batch_model_1.default.findOne({ _id: batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to add material to this batch' });
        }
        const material = new language_material_model_1.default({
            batchId,
            title,
            subtitle,
            description,
            fileUrl, // Can be empty string if optional
            uploadedBy: trainerId
        });
        yield material.save();
        res.status(201).json(material);
    }
    catch (error) {
        console.error("Error adding material:", error);
        res.status(500).json({ message: 'Error adding material', error });
    }
});
exports.addMaterial = addMaterial;
// Add Announcement to a Batch
const addAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { batchId, title, content } = req.body;
        const trainerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Verify trainer owns the batch
        const batch = yield language_batch_model_1.default.findOne({ _id: batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to add announcement to this batch' });
        }
        const announcement = new language_announcement_model_1.default({
            batchId,
            title,
            content,
            senderId: trainerId
        });
        yield announcement.save();
        res.status(201).json(announcement);
    }
    catch (error) {
        res.status(500).json({ message: 'Error adding announcement', error });
    }
});
exports.addAnnouncement = addAnnouncement;
// Get specific batch details (for both Student and Trainer)
const getBatchDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { batchId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const batch = yield language_batch_model_1.default.findById(batchId)
            .populate('students', 'name email phoneNumber avatar germanLevel guardianName guardianPhone qualification dateOfBirth')
            .populate('materials')
            .populate('announcements')
            .populate('classes');
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        // Check access: Must be Trainer of the batch OR a Student in the batch
        const isTrainer = ((_b = batch.trainerId) === null || _b === void 0 ? void 0 : _b.toString()) === (userId === null || userId === void 0 ? void 0 : userId.toString());
        const isStudent = batch.students.some((s) => s._id.toString() === (userId === null || userId === void 0 ? void 0 : userId.toString()) || s.toString() === (userId === null || userId === void 0 ? void 0 : userId.toString()));
        if (!isTrainer && !isStudent) {
            return res.status(403).json({ message: 'Not authorized to view this batch' });
        }
        // Explicitly map response to ensure all fields are sent
        const batchObj = batch.toObject();
        // Trainers get full student data; students only see name + avatar
        batchObj.students = batch.students.map((s) => {
            if (isTrainer) {
                return {
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
                };
            }
            else {
                // Student viewers: only name and avatar
                return {
                    _id: s._id,
                    name: s.name,
                    avatar: s.avatar,
                };
            }
        });
        res.json(batchObj);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching batch details', error });
    }
});
exports.getBatchDetails = getBatchDetails;
// Delete Material
const deleteMaterial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { materialId } = req.params;
        const trainerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const material = yield language_material_model_1.default.findById(materialId);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }
        // Verify trainer owns the batch
        const batch = yield language_batch_model_1.default.findOne({ _id: material.batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to delete this material' });
        }
        // Delete file from filesystem
        if (material.fileUrl) {
            try {
                // material.fileUrl is like "/uploads/materials/filename.ext"
                // We need to map this to "/home/sovirtraining/file_serve/materials/filename.ext"
                // Remove "/uploads" prefix from the URL to get relative path inside file_serve
                // "/uploads/materials/file.pdf" -> "/materials/file.pdf"
                const relativePath = material.fileUrl.replace('/uploads', '');
                // Construct absolute path
                const filePath = path_1.default.join('/home/sovirtraining/file_serve', relativePath);
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
                else {
                    console.warn(`File not found for deletion: ${filePath}`);
                }
            }
            catch (err) {
                console.error("Error deleting physical file:", err);
                // Continue to delete record
            }
        }
        yield language_material_model_1.default.findByIdAndDelete(materialId);
        res.json({ message: 'Material deleted successfully' });
    }
    catch (error) {
        console.error("Error deleting material:", error);
        res.status(500).json({ message: 'Error deleting material', error });
    }
});
exports.deleteMaterial = deleteMaterial;
// Delete Announcement
const deleteAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { announcementId } = req.params;
        const trainerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const announcement = yield language_announcement_model_1.default.findById(announcementId);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        // Verify trainer owns the batch
        const batch = yield language_batch_model_1.default.findOne({ _id: announcement.batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to delete this announcement' });
        }
        yield language_announcement_model_1.default.findByIdAndDelete(announcementId);
        res.json({ message: 'Announcement deleted successfully' });
    }
    catch (error) {
        console.error("Error deleting announcement:", error);
        res.status(500).json({ message: 'Error deleting announcement', error });
    }
});
exports.deleteAnnouncement = deleteAnnouncement;
// Schedule a Class
const scheduleClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { batchId, topic, startTime } = req.body; // Remove meetLink from req.body
        const trainerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Verify trainer owns the batch
        const batch = yield language_batch_model_1.default.findOne({ _id: batchId, trainerId }).populate('students');
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to schedule class for this batch' });
        }
        // Check if trainer has connected Google Calendar
        const trainer = yield user_model_1.default.findById(trainerId).select('+googleRefreshToken');
        let meetLink = '';
        let eventId = '';
        if (trainer === null || trainer === void 0 ? void 0 : trainer.googleRefreshToken) {
            try {
                googleService.setCredentials(trainer.googleRefreshToken);
                // Get student emails
                const attendeeEmails = batch.students.map(s => s.email);
                // Also add trainer
                if (trainer.email)
                    attendeeEmails.push(trainer.email);
                const event = yield googleService.createMeeting(`Class: ${topic}`, `Live class for ${batch.courseTitle} - ${batch.name}`, new Date(startTime), 60, attendeeEmails);
                meetLink = event.meetLink;
                eventId = event.eventId;
            }
            catch (err) {
                console.error("Failed to create Google Meet event:", err);
                // Fallback or Error? unique choice.
                // If critical, return error. If optional, maybe let them paste or fail.
                // Assuming "automatic specific", if it fails, maybe return error telling them to reconnect.
                // But for robustness, let's allow fallback if we had a link input, but we are removing it.
                // Better to throw error so they know integration failed.
                return res.status(500).json({ message: 'Failed to create Google Meet event. Please reconnect Google Calendar.' });
            }
        }
        else {
            // If not connected, we can't auto-generate.
            // If manual link is allowed, we could check req.body.meetLink?
            // But requirement is "automatically created".
            // So we return error asking to connect.
            // HOWEVER, to keep existing functionality working if they passed a link manually (fallback):
            if (req.body.meetLink) {
                meetLink = req.body.meetLink;
            }
            else {
                return res.status(400).json({ message: 'Google Calendar not connected. Please connect or provide a link manually.' });
            }
        }
        const newClass = new language_class_model_1.default({
            batchId,
            trainerId,
            topic,
            startTime,
            meetLink,
            eventId
        });
        yield newClass.save();
        res.status(201).json(newClass);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error scheduling class', error });
    }
});
exports.scheduleClass = scheduleClass;
// Delete a Class
const deleteClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { classId } = req.params;
        const trainerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const languageClass = yield language_class_model_1.default.findById(classId);
        if (!languageClass) {
            return res.status(404).json({ message: 'Class not found' });
        }
        // Verify trainer owns the batch
        const batch = yield language_batch_model_1.default.findOne({ _id: languageClass.batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to delete this class' });
        }
        // Delete from Google Calendar
        if (languageClass.eventId) {
            const trainer = yield user_model_1.default.findById(trainerId).select('+googleRefreshToken');
            if (trainer === null || trainer === void 0 ? void 0 : trainer.googleRefreshToken) {
                googleService.setCredentials(trainer.googleRefreshToken);
                yield googleService.deleteEvent(languageClass.eventId);
            }
        }
        yield language_class_model_1.default.findByIdAndDelete(classId);
        res.json({ message: 'Class deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting class', error });
    }
});
exports.deleteClass = deleteClass;
// End a Class
const endClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { classId } = req.params;
        const trainerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const languageClass = yield language_class_model_1.default.findById(classId);
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
            const trainer = yield user_model_1.default.findById(trainerId).select('+googleRefreshToken');
            if (trainer === null || trainer === void 0 ? void 0 : trainer.googleRefreshToken) {
                googleService.setCredentials(trainer.googleRefreshToken);
                yield googleService.deleteEvent(languageClass.eventId);
            }
        }
        languageClass.status = 'completed';
        yield languageClass.save();
        res.json({ message: 'Class ended successfully', class: languageClass });
    }
    catch (error) {
        res.status(500).json({ message: 'Error ending class', error });
    }
});
exports.endClass = endClass;
// Manually Update Attendance
const updateAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { classId } = req.params;
        const { studentId, attended } = req.body;
        const trainerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const languageClass = yield language_class_model_1.default.findById(classId);
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
        }
        else {
            // Remove
            languageClass.attendees = languageClass.attendees.filter(a => a.studentId.toString() !== studentId);
        }
        yield languageClass.save();
        res.json({ message: 'Attendance updated', attendees: languageClass.attendees });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating attendance', error });
    }
});
exports.updateAttendance = updateAttendance;
// Join Class (Record Attendance)
const joinClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { classId } = req.params;
        const studentId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const languageClass = yield language_class_model_1.default.findById(classId);
        if (!languageClass) {
            return res.status(404).json({ message: 'Class not found' });
        }
        // Check if already joined
        const alreadyJoined = languageClass.attendees.some(a => a.studentId.toString() === (studentId === null || studentId === void 0 ? void 0 : studentId.toString()));
        if (!alreadyJoined && studentId) {
            languageClass.attendees.push({
                studentId: studentId,
                joinedAt: new Date()
            });
            yield languageClass.save();
        }
        res.json({ message: 'Attendance recorded', link: languageClass.meetLink });
    }
    catch (error) {
        res.status(500).json({ message: 'Error joining class', error });
    }
});
exports.joinClass = joinClass;
// ─── Paginated Tab Endpoints ──────────────────────────────────────────────────
const verifyBatchAccess = (batchId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const batch = yield language_batch_model_1.default.findById(batchId);
    if (!batch)
        return null;
    const isTrainer = ((_a = batch.trainerId) === null || _a === void 0 ? void 0 : _a.toString()) === userId;
    const isStudent = batch.students.some((s) => s.toString() === userId);
    if (!isTrainer && !isStudent)
        return null;
    return batch;
});
// GET /batch/:batchId/announcements?page=1&limit=10
const getBatchAnnouncements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { batchId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
        const batch = yield verifyBatchAccess(batchId, userId);
        if (!batch)
            return res.status(403).json({ message: 'Not authorized' });
        const total = yield language_announcement_model_1.default.countDocuments({ batchId });
        const data = yield language_announcement_model_1.default.find({ batchId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json({ data, total, page, pages: Math.ceil(total / limit), hasMore: skip + data.length < total });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching announcements', error });
    }
});
exports.getBatchAnnouncements = getBatchAnnouncements;
// GET /batch/:batchId/materials?page=1&limit=10
const getBatchMaterials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { batchId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
        const batch = yield verifyBatchAccess(batchId, userId);
        if (!batch)
            return res.status(403).json({ message: 'Not authorized' });
        const total = yield language_material_model_1.default.countDocuments({ batchId });
        const data = yield language_material_model_1.default.find({ batchId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json({ data, total, page, pages: Math.ceil(total / limit), hasMore: skip + data.length < total });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching materials', error });
    }
});
exports.getBatchMaterials = getBatchMaterials;
// GET /batch/:batchId/students?page=1&limit=10
const getBatchStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { batchId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
        const batch = yield language_batch_model_1.default.findById(batchId)
            .populate({
            path: 'students',
            select: 'name email phoneNumber avatar germanLevel guardianName guardianPhone qualification dateOfBirth',
            options: { skip, limit }
        });
        if (!batch)
            return res.status(404).json({ message: 'Batch not found' });
        const isTrainer = ((_c = batch.trainerId) === null || _c === void 0 ? void 0 : _c.toString()) === userId;
        const isStudent = batch.students.some(s => { var _a; return ((_a = s._id) === null || _a === void 0 ? void 0 : _a.toString()) === userId; }) ||
            (yield language_batch_model_1.default.findOne({ _id: batchId, students: userId })) !== null;
        if (!isTrainer && !isStudent)
            return res.status(403).json({ message: 'Not authorized' });
        const total = batch.students.length + skip; // approximate — use raw count below
        const totalCount = yield language_batch_model_1.default.aggregate([
            { $match: { _id: batch._id } },
            { $project: { count: { $size: '$students' } } }
        ]);
        const trueTotal = ((_d = totalCount[0]) === null || _d === void 0 ? void 0 : _d.count) || 0;
        // Trainers see full data; students viewing classmates only see name + avatar
        const data = batch.students.map(s => {
            if (isTrainer) {
                return {
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
                };
            }
            else {
                return {
                    _id: s._id,
                    name: s.name,
                    avatar: s.avatar,
                };
            }
        });
        res.json({ data, total: trueTotal, page, pages: Math.ceil(trueTotal / limit), hasMore: skip + data.length < trueTotal });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching students', error });
    }
});
exports.getBatchStudents = getBatchStudents;
// GET /batch/:batchId/classes?page=1&limit=10
const getBatchClasses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { batchId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
        const batch = yield verifyBatchAccess(batchId, userId);
        if (!batch)
            return res.status(403).json({ message: 'Not authorized' });
        const total = yield language_class_model_1.default.countDocuments({ batchId });
        const data = yield language_class_model_1.default.find({ batchId })
            .sort({ startTime: -1 })
            .skip(skip)
            .limit(limit);
        res.json({ data, total, page, pages: Math.ceil(total / limit), hasMore: skip + data.length < total });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching classes', error });
    }
});
exports.getBatchClasses = getBatchClasses;
