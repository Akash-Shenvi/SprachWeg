import { Request, Response } from 'express';
import SkillCourse, { ISkillCourse } from '../models/skillCourse.model';
import fs from 'fs';
import path from 'path';

export const createCourse = async (req: Request, res: Response) => {
    try {
        const {
            title, subtitle, level, description, features, category,
            price, originalPrice, rating, students, duration, startDate, mode, popular,
            levels
        } = req.body;

        let imagePath = '';
        if (req.file) {
            // Store relative path from uploads folder (e.g., 'courses/image-123.jpg')
            // This works with app.use('/uploads', express.static('uploads'))
            imagePath = path.join('courses', req.file.filename).replace(/\\/g, '/');
        }

        const newCourse = new SkillCourse({
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

        const savedCourse = await newCourse.save();
        res.status(201).json(savedCourse);
    } catch (error: any) {
        res.status(500).json({ message: 'Error creating course', error: error.message });
    }
};

export const getAllCourses = async (req: Request, res: Response) => {
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

        const courses = await SkillCourse.find(query).sort({ createdAt: -1 });
        res.status(200).json(courses);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
};

export const updateCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            title, subtitle, level, description, features, category,
            price, originalPrice, rating, students, duration, startDate, mode, popular,
            levels
        } = req.body;

        const course = await SkillCourse.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (title) course.title = title;
        if (subtitle) course.subtitle = subtitle;
        if (level) course.level = level;
        if (description) course.description = description;
        if (features) course.features = typeof features === 'string' ? JSON.parse(features) : features;
        if (category) course.category = category;
        if (price) course.price = price;
        if (originalPrice) course.originalPrice = originalPrice;
        if (rating) course.rating = rating;
        if (students) course.students = students;
        if (duration) course.duration = duration;
        if (startDate) course.startDate = startDate;
        if (mode) course.mode = mode;
        if (mode) course.mode = mode;
        if (typeof popular !== 'undefined') course.popular = popular === 'true' || popular === true;
        if (levels) course.levels = typeof levels === 'string' ? JSON.parse(levels) : levels;

        if (req.file) {
            // Delete old image if it exists
            if (course.image) {
                const oldImagePath = path.join('uploads', course.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            // Store relative path from uploads folder
            course.image = path.join('courses', req.file.filename).replace(/\\/g, '/');
        }

        const updatedCourse = await course.save();
        res.status(200).json(updatedCourse);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating course', error: error.message });
    }
};

export const deleteCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const course = await SkillCourse.findById(id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Delete image file
        if (course.image) {
            const imagePath = path.join('uploads', course.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await SkillCourse.deleteOne({ _id: id });
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting course', error: error.message });
    }
};
