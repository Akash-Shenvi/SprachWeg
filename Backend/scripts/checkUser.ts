
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user.model';

dotenv.config({ path: '/home/sovirtraining/.env' });


import fs from 'fs';
import path from 'path';

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: 'akashshenvi93@gmail.com' });
        if (user) {
            const userData = user.toJSON();
            console.log('User found:', JSON.stringify(userData, null, 2));
            fs.writeFileSync(path.join(__dirname, 'user_output.json'), JSON.stringify(userData, null, 2));
        } else {
            console.log('User not found');
            fs.writeFileSync(path.join(__dirname, 'user_output.json'), JSON.stringify({ message: 'User not found' }, null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
        fs.writeFileSync(path.join(__dirname, 'user_output.json'), JSON.stringify({ error: (error as any).message }, null, 2));
    } finally {
        await mongoose.disconnect();
    }
};

checkUser();

