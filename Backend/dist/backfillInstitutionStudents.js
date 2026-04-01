"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const institutionEnrollmentRequest_model_1 = __importDefault(require("./models/institutionEnrollmentRequest.model"));
const user_model_1 = __importDefault(require("./models/user.model"));
const database_1 = require("./config/database");
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.connectDB)();
    const approvedRequests = yield institutionEnrollmentRequest_model_1.default.find({
        status: 'APPROVED',
        'students.createdUserId': { $exists: true, $ne: null },
    }).populate('institutionId', 'name institutionName institutionLogo institutionTagline');
    let updatedUsers = 0;
    for (const request of approvedRequests) {
        const institution = request.institutionId;
        if (!(institution === null || institution === void 0 ? void 0 : institution._id)) {
            continue;
        }
        for (const student of request.students) {
            if (!student.createdUserId) {
                continue;
            }
            const result = yield user_model_1.default.updateOne({ _id: student.createdUserId }, {
                $set: {
                    role: 'institution_student',
                    institutionId: institution._id,
                    institutionName: institution.institutionName || institution.name,
                    institutionLogo: institution.institutionLogo || null,
                    institutionTagline: institution.institutionTagline || null,
                },
            });
            updatedUsers += result.modifiedCount;
        }
    }
    console.log(`Backfill complete. Updated ${updatedUsers} institution students.`);
    process.exit(0);
});
run().catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
});
