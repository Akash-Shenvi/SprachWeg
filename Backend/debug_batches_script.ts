
import mongoose from 'mongoose';
import LanguageBatch from './src/models/language.batch.model';
import User from './src/models/user.model';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '/home/sovirtraining/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sprachweg';

const runDebug = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const batches = await LanguageBatch.find({});
        const fs = require('fs');
        fs.writeFileSync('debug_output.json', JSON.stringify(batches, null, 2));
        console.log('Written to debug_output.json');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

runDebug();
