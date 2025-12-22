import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import SkillCourse from '../src/models/skillCourse.model';

// Generic dotenv setup - might need adjustment based on where it's run
dotenv.config({ path: '/home/sovirtraining/.env' });

const courses = [
    {
        title: 'German for Study & Work in Germany',
        subtitle: 'Comprehensive German Language Course',
        description: 'Prepare for life, study, and work in Germany with structured A1–B2 German courses and TestDaF support.',
        price: '15999',
        level: 'A1-B2',
        category: 'Language',
        image: 'https://via.placeholder.com/600x400?text=German+Course',
        features: ['Structured Curriculum', 'TestDaF Support', 'Visa Interview Prep'],
        startDate: '2024-02-01',
        duration: '12 Weeks'
    },
    {
        title: 'Business & Academic English Mastery',
        subtitle: 'Advanced English for Professionals',
        description: 'Develop fluent, confident English for global workplaces, universities, and international opportunities.',
        price: '12999',
        level: 'Beginner-Advanced',
        category: 'Language',
        image: 'https://via.placeholder.com/600x400?text=English+Course',
        features: ['Business Communication', 'Academic Writing', 'IELTS Prep'],
        startDate: '2024-02-15',
        duration: '10 Weeks'
    },
    {
        title: 'JLPT-focused Japanese Program',
        subtitle: 'N5 to N2 Japanese Course',
        description: 'Learn Japanese from N5 to N2 with structured grammar, kanji, and speaking practice tailored to JLPT.',
        price: '16999',
        level: 'N5-N2',
        category: 'Language',
        image: 'https://via.placeholder.com/600x400?text=Japanese+Course',
        features: ['JLPT Focused', 'Kanji Practice', 'Conversation Labs'],
        startDate: '2024-03-01',
        duration: '14 Weeks'
    }
];

const seedCourses = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB');

        for (const course of courses) {
            const existing = await SkillCourse.findOne({ title: course.title });
            if (existing) {
                console.log(`Course "${course.title}" already exists.`);
            } else {
                await SkillCourse.create(course);
                console.log(`Created course: ${course.title}`);
            }
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedCourses();
