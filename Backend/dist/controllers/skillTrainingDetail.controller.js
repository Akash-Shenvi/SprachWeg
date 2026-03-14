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
exports.getDetailByCourseId = exports.createOrUpdateDetail = void 0;
const skillTrainingDetail_model_1 = __importDefault(require("../models/skillTrainingDetail.model"));
const skillCourse_model_1 = __importDefault(require("../models/skillCourse.model"));
// Create or Update Details for a specific course
const createOrUpdateDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { skillCourseId, deliveryMode, classTimings, fees, origin } = req.body;
        if (!skillCourseId) {
            return res.status(400).json({ message: 'skillCourseId is required' });
        }
        // Check if course exists
        const course = yield skillCourse_model_1.default.findById(skillCourseId);
        if (!course) {
            return res.status(404).json({ message: 'Skill Course not found' });
        }
        // Upsert: update if exists, insert if not
        const detail = yield skillTrainingDetail_model_1.default.findOneAndUpdate({ skillCourseId }, { deliveryMode, classTimings, fees, origin }, { new: true, upsert: true, setDefaultsOnInsert: true });
        res.status(200).json(detail);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating details', error: error.message });
    }
});
exports.createOrUpdateDetail = createOrUpdateDetail;
// Get details by Course ID
const getDetailByCourseId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { courseId } = req.params;
        const detail = yield skillTrainingDetail_model_1.default.findOne({ skillCourseId: courseId });
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching details', error: error.message });
    }
});
exports.getDetailByCourseId = getDetailByCourseId;
