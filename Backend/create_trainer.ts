import mongoose from 'mongoose';
import User from './src/models/user.model';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/sovirtraining/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sprachweg';

const createTrainerRole = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // Find a user to make a trainer (you can modify the email here)
        const email = process.argv[2]; // Pass email as argument

        if (!email) {
            console.log('Usage: npx ts-node create_trainer.ts <user-email>');
            console.log('\nExample: npx ts-node create_trainer.ts john@example.com');

            // List all users
            const allUsers = await User.find({}).select('name email role');
            console.log('\n--- Available Users ---');
            allUsers.forEach(u => {
                console.log(`  - ${u.email} (${u.name}) - Current Role: ${u.role}`);
            });
            process.exit(1);
        }

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (${user.email})`);
        console.log(`Current role: ${user.role}`);

        user.role = 'trainer';
        await user.save();

        console.log(`✅ Successfully updated ${user.name}'s role to 'trainer'`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createTrainerRole();
