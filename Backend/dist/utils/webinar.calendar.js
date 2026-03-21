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
exports.syncWebinarCalendarEvent = exports.getApprovedWebinarAttendeeEmails = exports.getTrainerCalendarState = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const webinarRegistration_model_1 = __importDefault(require("../models/webinarRegistration.model"));
const google_calendar_service_1 = require("../services/google.calendar.service");
const WEBINAR_DURATION_MINUTES = 60;
const googleService = new google_calendar_service_1.GoogleCalendarService();
const formatWebinarPrice = (price, currency) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0,
}).format(price);
const buildWebinarSummary = (webinar) => `Webinar: ${webinar.title}`;
const buildWebinarDescription = (webinar) => {
    var _a, _b;
    const sections = [
        (_a = webinar.shortDescription) === null || _a === void 0 ? void 0 : _a.trim(),
        (_b = webinar.description) === null || _b === void 0 ? void 0 : _b.trim(),
        `Scheduled for: ${webinar.scheduledAt.toISOString()}`,
        `Registration Fee: ${formatWebinarPrice(webinar.price, webinar.currency || 'INR')}`,
    ].filter(Boolean);
    return sections.join('\n\n');
};
const getTrainerCalendarState = (trainerId) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedTrainerId = String(trainerId !== null && trainerId !== void 0 ? trainerId : '').trim();
    if (!normalizedTrainerId) {
        return {
            trainer: null,
            connected: false,
        };
    }
    const trainer = yield user_model_1.default.findById(normalizedTrainerId)
        .select('name email role +googleRefreshToken')
        .lean();
    if (!trainer || trainer.role !== 'trainer') {
        return {
            trainer: null,
            connected: false,
        };
    }
    return {
        trainer: {
            _id: String(trainer._id),
            name: String(trainer.name || '').trim(),
            email: String(trainer.email || '').trim(),
            googleRefreshToken: trainer.googleRefreshToken,
        },
        connected: !!trainer.googleRefreshToken,
    };
});
exports.getTrainerCalendarState = getTrainerCalendarState;
const getApprovedWebinarAttendeeEmails = (webinarId) => __awaiter(void 0, void 0, void 0, function* () {
    const registrations = yield webinarRegistration_model_1.default.find({
        webinarId: webinarId,
        status: 'accepted',
    }).populate('userId', 'email');
    return [...new Set(registrations
            .map((registration) => { var _a; return String(((_a = registration.userId) === null || _a === void 0 ? void 0 : _a.email) || '').trim().toLowerCase(); })
            .filter(Boolean))];
});
exports.getApprovedWebinarAttendeeEmails = getApprovedWebinarAttendeeEmails;
const syncWebinarCalendarEvent = (webinar, options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const trainerState = yield (0, exports.getTrainerCalendarState)(webinar.trainerId);
    if (!trainerState.trainer) {
        throw new Error('Please assign a valid trainer before publishing this webinar.');
    }
    if (!trainerState.connected || !trainerState.trainer.googleRefreshToken) {
        throw new Error('Assigned trainer must connect Google Calendar before publishing this webinar.');
    }
    const attendees = yield (0, exports.getApprovedWebinarAttendeeEmails)(webinar._id);
    const summary = buildWebinarSummary(webinar);
    const description = buildWebinarDescription(webinar);
    const previousTrainerId = String((_a = options === null || options === void 0 ? void 0 : options.previousTrainerId) !== null && _a !== void 0 ? _a : '').trim();
    const currentTrainerId = String((_b = webinar.trainerId) !== null && _b !== void 0 ? _b : '').trim();
    const previousEventId = String((_d = (_c = options === null || options === void 0 ? void 0 : options.previousEventId) !== null && _c !== void 0 ? _c : webinar.googleCalendarEventId) !== null && _d !== void 0 ? _d : '').trim();
    googleService.setCredentials(trainerState.trainer.googleRefreshToken);
    if (previousEventId && previousTrainerId && previousTrainerId === currentTrainerId) {
        const updatedEvent = yield googleService.updateMeeting(previousEventId, summary, description, webinar.scheduledAt, WEBINAR_DURATION_MINUTES, attendees);
        webinar.joinLink = updatedEvent.meetLink || webinar.joinLink || '';
        webinar.googleCalendarEventId = updatedEvent.eventId || previousEventId;
    }
    else {
        const createdEvent = yield googleService.createMeeting(summary, description, webinar.scheduledAt, WEBINAR_DURATION_MINUTES, attendees);
        if (!createdEvent.meetLink) {
            throw new Error('Google Calendar did not return a valid meeting link for this webinar.');
        }
        webinar.joinLink = createdEvent.meetLink;
        webinar.googleCalendarEventId = createdEvent.eventId;
        if (previousEventId && previousTrainerId && previousTrainerId !== currentTrainerId) {
            const previousTrainerState = yield (0, exports.getTrainerCalendarState)(previousTrainerId);
            if (previousTrainerState.connected && ((_e = previousTrainerState.trainer) === null || _e === void 0 ? void 0 : _e.googleRefreshToken)) {
                googleService.setCredentials(previousTrainerState.trainer.googleRefreshToken);
                yield googleService.deleteEvent(previousEventId);
            }
        }
    }
    webinar.calendarSyncStatus = 'scheduled';
    webinar.calendarSyncError = undefined;
});
exports.syncWebinarCalendarEvent = syncWebinarCalendarEvent;
