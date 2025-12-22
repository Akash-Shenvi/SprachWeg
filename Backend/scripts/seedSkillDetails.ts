
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SkillCourse from '../src/models/skillCourse.model';
import SkillTrainingDetail from '../src/models/skillTrainingDetail.model';

dotenv.config({ path: '/home/sovirtraining/.env' });

/**
 * Migration script to seed SkillTrainingDetail for existing SkillCourses
 */
const seedSkillDetails = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // Ensure MONGO_URI is set, or provide a default for local testing if safe
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sprachweg';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB.');

        const courses = await SkillCourse.find();
        console.log(`Found ${courses.length} skill courses.`);

        let updatedCount = 0;

        for (const course of courses) {
            // Check if details already exist
            const existingDetail = await SkillTrainingDetail.findOne({ skillCourseId: course._id });

            if (!existingDetail) {
                console.log(`Creating details for course: ${course.title} (${course._id})`);
                await SkillTrainingDetail.create({
                    skillCourseId: course._id,
                    deliveryMode: 'On-site / Online / Hybrid',
                    classTimings: 'Customized Schedule',
                    fees: '₹28,000'
                });
                updatedCount++;
            } else {
                console.log(`Details already exist for course: ${course.title} (${course._id})`);
            }
        }

        console.log(`Migration completed. Created details for ${updatedCount} courses.`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

seedSkillDetails();
