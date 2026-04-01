import 'reflect-metadata';
import InstitutionEnrollmentRequest from './models/institutionEnrollmentRequest.model';
import User from './models/user.model';
import { connectDB } from './config/database';

const run = async () => {
    await connectDB();

    const approvedRequests = await InstitutionEnrollmentRequest.find({
        status: 'APPROVED',
        'students.createdUserId': { $exists: true, $ne: null },
    }).populate('institutionId', 'name institutionName institutionLogo institutionTagline');

    let updatedUsers = 0;

    for (const request of approvedRequests) {
        const institution = request.institutionId as any;
        if (!institution?._id) {
            continue;
        }

        for (const student of request.students) {
            if (!student.createdUserId) {
                continue;
            }

            const result = await User.updateOne(
                { _id: student.createdUserId },
                {
                    $set: {
                        role: 'institution_student',
                        institutionId: institution._id,
                        institutionName: institution.institutionName || institution.name,
                        institutionLogo: institution.institutionLogo || null,
                        institutionTagline: institution.institutionTagline || null,
                    },
                }
            );

            updatedUsers += result.modifiedCount;
        }
    }

    console.log(`Backfill complete. Updated ${updatedUsers} institution students.`);
    process.exit(0);
};

run().catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
});
