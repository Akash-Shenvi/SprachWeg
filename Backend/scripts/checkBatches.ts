
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LanguageBatch from '../src/models/language.batch.model';
import User from '../src/models/user.model';
import fs from 'fs';
import path from 'path';

dotenv.config();

const checkBatches = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB');

        // Find the user Akash first
        const user = await User.findOne({ email: 'akashshenvi93@gmail.com' });
        if (!user) {
            console.log('User Akash not found');
            return;
        }
        console.log(`User Akash ID: ${user._id}`);

        // Find batches where this user is a student
        const batches = await LanguageBatch.find({ students: user._id })
            .populate('students', 'name email phoneNumber guardianName guardianPhone qualification dateOfBirth');

        const output = batches.map(b => ({
            id: b._id,
            name: b.name,
            courseTitle: b.courseTitle,
            students: b.students.map((s: any) => ({
                id: s._id,
                name: s.name,
                email: s.email,
                guardianName: s.guardianName,
                qualification: s.qualification,
                dateOfBirth: s.dateOfBirth
            }))
        }));

        console.log('Batches found:', JSON.stringify(output, null, 2));
        fs.writeFileSync(path.join(__dirname, 'batch_output.json'), JSON.stringify(output, null, 2));

    } catch (error) {
        console.error('Error:', error);
        fs.writeFileSync(path.join(__dirname, 'batch_output.json'), JSON.stringify({ error: (error as any).message }, null, 2));
    } finally {
        await mongoose.disconnect();
    }
};

checkBatches();
