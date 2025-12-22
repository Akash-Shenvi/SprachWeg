import mongoose from 'mongoose';
import User from './src/models/user.model';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/sovirtraining/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sprachweg';

const checkTrainers = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const trainers = await User.find({ role: 'trainer' });
        console.log('--- TRAINERS IN DATABASE ---');
        console.log(`Found ${trainers.length} trainer(s)`);

        if (trainers.length > 0) {
            trainers.forEach(t => {
                console.log(`  - ${t.name} (${t.email}) [ID: ${t._id}]`);
            });
        } else {
            console.log('No trainers found. You need to create a user with role="trainer"');
        }

        // Also check all users
        const allUsers = await User.find({}).select('name email role');
        console.log('\n--- ALL USERS ---');
        allUsers.forEach(u => {
            console.log(`  - ${u.name} (${u.email}) - Role: ${u.role}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkTrainers();
