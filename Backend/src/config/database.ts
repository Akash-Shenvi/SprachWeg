import mongoose from 'mongoose';
import { env } from './env';
import LanguageBatch from '../models/language.batch.model';
import Notification from '../models/notification.model';

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        try {
            await LanguageBatch.syncIndexes();
            console.log('LanguageBatch indexes synchronized.');
        } catch (indexError) {
            console.error('Failed to synchronize LanguageBatch indexes:', indexError);
        }

        try {
            await Notification.syncIndexes();
            console.log('Notification indexes synchronized.');
        } catch (indexError) {
            console.error('Failed to synchronize Notification indexes:', indexError);
        }
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
};
