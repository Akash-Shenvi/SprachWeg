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
exports.deleteCourse = exports.updateCourse = exports.getAllCourses = exports.createCourse = void 0;
const skillCourse_model_1 = __importDefault(require("../models/skillCourse.model"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const createCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, subtitle, level, description, features, category, price, originalPrice, rating, students, duration, startDate, mode, popular, levels } = req.body;
        let imagePath = '';
        if (req.file) {
            // Store relative path from uploads folder (e.g., 'courses/image-123.jpg')
            // This works with app.use('/uploads', express.static('uploads'))
            imagePath = path_1.default.join('courses', req.file.filename).replace(/\\/g, '/');
        }
        const newCourse = new skillCourse_model_1.default({
            title,
            subtitle,
            level,
            description,
            features: typeof features === 'string' ? JSON.parse(features) : features,
            category,
            price,
            originalPrice,
            rating: rating || '4.5',
            students: students || '0',
            duration,
            startDate,
            mode: mode || 'Live',
            popular: popular === 'true' || popular === true,
            image: imagePath,
            levels: typeof levels === 'string' ? JSON.parse(levels) : levels || [],
        });
        const savedCourse = yield newCourse.save();
        res.status(201).json(savedCourse);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating course', error: error.message });
    }
});
exports.createCourse = createCourse;
const getAllCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            };
        }
        const courses = yield skillCourse_model_1.default.find(query).sort({ createdAt: -1 });
        res.status(200).json(courses);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
});
exports.getAllCourses = getAllCourses;
const updateCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, subtitle, level, description, features, category, price, originalPrice, rating, students, duration, startDate, mode, popular, levels } = req.body;
        const course = yield skillCourse_model_1.default.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        if (title)
            course.title = title;
        if (subtitle)
            course.subtitle = subtitle;
        if (level)
            course.level = level;
        if (description)
            course.description = description;
        if (features)
            course.features = typeof features === 'string' ? JSON.parse(features) : features;
        if (category)
            course.category = category;
        if (price)
            course.price = price;
        if (originalPrice)
            course.originalPrice = originalPrice;
        if (rating)
            course.rating = rating;
        if (students)
            course.students = students;
        if (duration)
            course.duration = duration;
        if (startDate)
            course.startDate = startDate;
        if (mode)
            course.mode = mode;
        if (mode)
            course.mode = mode;
        if (typeof popular !== 'undefined')
            course.popular = popular === 'true' || popular === true;
        if (levels)
            course.levels = typeof levels === 'string' ? JSON.parse(levels) : levels;
        if (req.file) {
            // Delete old image if it exists
            if (course.image) {
                const oldImagePath = path_1.default.join('/home/sovirtraining/file_serve', course.image);
                if (fs_1.default.existsSync(oldImagePath)) {
                    fs_1.default.unlinkSync(oldImagePath);
                }
            }
            // Store relative path from uploads folder
            course.image = path_1.default.join('courses', req.file.filename).replace(/\\/g, '/');
        }
        const updatedCourse = yield course.save();
        res.status(200).json(updatedCourse);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating course', error: error.message });
    }
});
exports.updateCourse = updateCourse;
const deleteCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const course = yield skillCourse_model_1.default.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        // Delete image file
        if (course.image) {
            const imagePath = path_1.default.join('/home/sovirtraining/file_serve', course.image);
            if (fs_1.default.existsSync(imagePath)) {
                fs_1.default.unlinkSync(imagePath);
            }
        }
        yield skillCourse_model_1.default.deleteOne({ _id: id });
        res.status(200).json({ message: 'Course deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting course', error: error.message });
    }
});
exports.deleteCourse = deleteCourse;
