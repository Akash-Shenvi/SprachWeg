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
exports.updateWebinar = exports.createWebinar = exports.getTrainerAssignedWebinars = exports.getAdminWebinars = exports.getWebinarBySlug = exports.getPublicWebinars = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const webinar_model_1 = __importDefault(require("../models/webinar.model"));
const webinarRegistration_model_1 = __importDefault(require("../models/webinarRegistration.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const webinar_calendar_1 = require("../utils/webinar.calendar");
const slugify = (value) => value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
const parsePrice = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
};
const parseScheduledAt = (value) => {
    const normalizedValue = String(value !== null && value !== void 0 ? value : '').trim();
    if (!normalizedValue) {
        return null;
    }
    const parsedDate = new Date(normalizedValue);
    return Number.isFinite(parsedDate.getTime()) ? parsedDate : null;
};
const parseIsActive = (value) => {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string')
        return value.trim().toLowerCase() !== 'false';
    return true;
};
const buildWebinarPayload = (body) => {
    var _a, _b, _c, _d;
    const title = String((_a = body.title) !== null && _a !== void 0 ? _a : '').trim();
    const shortDescription = String((_b = body.shortDescription) !== null && _b !== void 0 ? _b : '').trim();
    const description = String((_c = body.description) !== null && _c !== void 0 ? _c : '').trim();
    const trainerId = String((_d = body.trainerId) !== null && _d !== void 0 ? _d : '').trim();
    const scheduledAt = parseScheduledAt(body.scheduledAt);
    const price = parsePrice(body.price);
    const isActive = parseIsActive(body.isActive);
    return {
        title,
        shortDescription,
        description,
        trainerId,
        scheduledAt,
        price,
        isActive,
    };
};
const validateWebinarPayload = (payload) => {
    if (!payload.title)
        return 'title is required.';
    if (!payload.shortDescription)
        return 'shortDescription is required.';
    if (!payload.description)
        return 'description is required.';
    if (!payload.trainerId)
        return 'trainerId is required.';
    if (!payload.scheduledAt)
        return 'Please provide a valid webinar date and time.';
    if (payload.price === null)
        return 'Please provide a valid webinar price.';
    return null;
};
const generateUniqueSlug = (title, webinarId) => __awaiter(void 0, void 0, void 0, function* () {
    const baseSlug = slugify(title) || 'webinar';
    let slug = baseSlug;
    let counter = 1;
    while (yield webinar_model_1.default.exists({ slug, _id: { $ne: webinarId } })) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
    }
    return slug;
});
const getNextSortOrder = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const lastWebinar = yield webinar_model_1.default.findOne().sort({ sortOrder: -1, createdAt: -1 }).select('sortOrder');
    return ((_a = lastWebinar === null || lastWebinar === void 0 ? void 0 : lastWebinar.sortOrder) !== null && _a !== void 0 ? _a : 0) + 1;
});
const getApprovedRegistrationCounts = (webinarIds) => __awaiter(void 0, void 0, void 0, function* () {
    if (webinarIds.length === 0) {
        return new Map();
    }
    const counts = yield webinarRegistration_model_1.default.aggregate([
        {
            $match: {
                webinarId: { $in: webinarIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) },
                status: 'accepted',
            },
        },
        {
            $group: {
                _id: '$webinarId',
                count: { $sum: 1 },
            },
        },
    ]);
    return new Map(counts.map((entry) => [String(entry._id), Number(entry.count || 0)]));
});
const getTrainerSummaries = (trainerIds) => __awaiter(void 0, void 0, void 0, function* () {
    if (trainerIds.length === 0) {
        return new Map();
    }
    const trainers = yield user_model_1.default.find({
        _id: { $in: trainerIds },
        role: 'trainer',
    })
        .select('name email +googleRefreshToken')
        .lean();
    return new Map(trainers.map((trainer) => [
        String(trainer._id),
        {
            _id: String(trainer._id),
            name: String(trainer.name || '').trim(),
            email: String(trainer.email || '').trim(),
            googleCalendarConnected: !!trainer.googleRefreshToken,
        },
    ]));
});
const serializeWebinars = (webinars) => __awaiter(void 0, void 0, void 0, function* () {
    const webinarIds = webinars.map((webinar) => String(webinar._id));
    const trainerIds = [...new Set(webinars.map((webinar) => String(webinar.trainerId || '').trim()).filter(Boolean))];
    const [approvedCounts, trainerMap] = yield Promise.all([
        getApprovedRegistrationCounts(webinarIds),
        getTrainerSummaries(trainerIds),
    ]);
    return webinars.map((webinar) => {
        const trainerId = String(webinar.trainerId || '').trim();
        const trainer = trainerMap.get(trainerId) || null;
        return Object.assign(Object.assign({}, webinar), { trainer, calendarReady: !!(trainer === null || trainer === void 0 ? void 0 : trainer.googleCalendarConnected), approvedRegistrationsCount: approvedCounts.get(String(webinar._id)) || 0 });
    });
});
const getAcceptedRegistrationCount = (webinarId) => __awaiter(void 0, void 0, void 0, function* () {
    return webinarRegistration_model_1.default.countDocuments({
        webinarId: webinarId,
        status: 'accepted',
    });
});
const applyDraftCalendarState = (webinar) => __awaiter(void 0, void 0, void 0, function* () {
    const trainerState = yield (0, webinar_calendar_1.getTrainerCalendarState)(webinar.trainerId);
    webinar.calendarSyncStatus = trainerState.connected ? 'draft' : 'needs_trainer_connection';
    webinar.calendarSyncError = trainerState.connected
        ? undefined
        : 'Assigned trainer must connect Google Calendar before publishing this webinar.';
});
const shouldSyncCalendarForSave = (webinar, options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const acceptedRegistrationCount = (_a = options === null || options === void 0 ? void 0 : options.acceptedRegistrationCount) !== null && _a !== void 0 ? _a : yield getAcceptedRegistrationCount(webinar._id);
    return webinar.isActive || !!(options === null || options === void 0 ? void 0 : options.hadExistingEvent) || acceptedRegistrationCount > 0;
});
const findTrainerValidationError = (trainerId, isActive) => __awaiter(void 0, void 0, void 0, function* () {
    const trainerState = yield (0, webinar_calendar_1.getTrainerCalendarState)(trainerId);
    if (!trainerState.trainer) {
        return 'Please assign a valid trainer to this webinar.';
    }
    if (isActive && !trainerState.connected) {
        return 'Assigned trainer must connect Google Calendar before publishing this webinar.';
    }
    return null;
});
const getAdminWebinarById = (webinarId) => __awaiter(void 0, void 0, void 0, function* () {
    const webinar = yield webinar_model_1.default.findById(webinarId).lean();
    if (!webinar) {
        return null;
    }
    const [serialized] = yield serializeWebinars([webinar]);
    return serialized;
});
const getPublicWebinars = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const webinars = yield webinar_model_1.default.find({ isActive: true })
            .select('-joinLink -trainerId -googleCalendarEventId -calendarSyncStatus -calendarSyncError')
            .sort({ sortOrder: 1, createdAt: 1 })
            .lean();
        return res.status(200).json({ webinars });
    }
    catch (error) {
        console.error('Fetching public webinars failed:', error);
        return res.status(500).json({ message: 'Failed to fetch webinars.' });
    }
});
exports.getPublicWebinars = getPublicWebinars;
const getWebinarBySlug = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const webinar = yield webinar_model_1.default.findOne({
            slug: String((_a = req.params.slug) !== null && _a !== void 0 ? _a : '').trim().toLowerCase(),
            isActive: true,
        })
            .select('-joinLink -trainerId -googleCalendarEventId -calendarSyncStatus -calendarSyncError')
            .lean();
        if (!webinar) {
            return res.status(404).json({ message: 'Webinar not found.' });
        }
        return res.status(200).json({ webinar });
    }
    catch (error) {
        console.error('Fetching webinar by slug failed:', error);
        return res.status(500).json({ message: 'Failed to fetch webinar.' });
    }
});
exports.getWebinarBySlug = getWebinarBySlug;
const getAdminWebinars = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const webinars = yield webinar_model_1.default.find()
            .sort({ sortOrder: 1, createdAt: 1 })
            .lean();
        return res.status(200).json({
            webinars: yield serializeWebinars(webinars),
        });
    }
    catch (error) {
        console.error('Fetching admin webinars failed:', error);
        return res.status(500).json({ message: 'Failed to fetch webinars.' });
    }
});
exports.getAdminWebinars = getAdminWebinars;
const getTrainerAssignedWebinars = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const trainerId = String((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : '').trim();
        const webinars = yield webinar_model_1.default.find({
            trainerId,
            scheduledAt: { $gte: new Date() },
        })
            .sort({ scheduledAt: 1, createdAt: 1 })
            .lean();
        const trainerState = yield (0, webinar_calendar_1.getTrainerCalendarState)(trainerId);
        return res.status(200).json({
            trainerCalendarConnected: trainerState.connected,
            webinars: yield serializeWebinars(webinars),
        });
    }
    catch (error) {
        console.error('Fetching trainer webinars failed:', error);
        return res.status(500).json({ message: 'Failed to fetch assigned webinars.' });
    }
});
exports.getTrainerAssignedWebinars = getTrainerAssignedWebinars;
const createWebinar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = buildWebinarPayload(req.body);
        const validationError = validateWebinarPayload(payload);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }
        const trainerValidationError = yield findTrainerValidationError(payload.trainerId, payload.isActive);
        if (trainerValidationError) {
            return res.status(400).json({ message: trainerValidationError });
        }
        const webinar = new webinar_model_1.default({
            title: payload.title,
            shortDescription: payload.shortDescription,
            description: payload.description,
            trainerId: payload.trainerId,
            scheduledAt: payload.scheduledAt,
            price: payload.price,
            isActive: payload.isActive,
            slug: yield generateUniqueSlug(payload.title),
            sortOrder: yield getNextSortOrder(),
        });
        if (yield shouldSyncCalendarForSave(webinar, { hadExistingEvent: false, acceptedRegistrationCount: 0 })) {
            yield (0, webinar_calendar_1.syncWebinarCalendarEvent)(webinar, {
                previousTrainerId: null,
                previousEventId: null,
            });
        }
        else {
            yield applyDraftCalendarState(webinar);
        }
        yield webinar.save();
        return res.status(201).json({
            message: webinar.isActive ? 'Webinar created and published successfully.' : 'Webinar draft saved successfully.',
            webinar: yield getAdminWebinarById(String(webinar._id)),
        });
    }
    catch (error) {
        console.error('Creating webinar failed:', error);
        return res.status(500).json({ message: (error === null || error === void 0 ? void 0 : error.message) || 'Failed to create webinar.' });
    }
});
exports.createWebinar = createWebinar;
const updateWebinar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const webinar = yield webinar_model_1.default.findById(req.params.id);
        if (!webinar) {
            return res.status(404).json({ message: 'Webinar not found.' });
        }
        const payload = buildWebinarPayload(req.body);
        const validationError = validateWebinarPayload(payload);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }
        const acceptedRegistrationCount = yield getAcceptedRegistrationCount(webinar._id);
        const hadExistingEvent = !!webinar.googleCalendarEventId;
        const previousTrainerId = webinar.trainerId;
        const previousEventId = webinar.googleCalendarEventId;
        const trainerValidationError = yield findTrainerValidationError(payload.trainerId, payload.isActive || hadExistingEvent || acceptedRegistrationCount > 0);
        if (trainerValidationError) {
            return res.status(400).json({ message: trainerValidationError });
        }
        webinar.set({
            title: payload.title,
            shortDescription: payload.shortDescription,
            description: payload.description,
            trainerId: payload.trainerId,
            scheduledAt: payload.scheduledAt,
            price: payload.price,
            isActive: payload.isActive,
            slug: yield generateUniqueSlug(payload.title, String(webinar._id)),
        });
        if (yield shouldSyncCalendarForSave(webinar, { hadExistingEvent, acceptedRegistrationCount })) {
            yield (0, webinar_calendar_1.syncWebinarCalendarEvent)(webinar, {
                previousTrainerId,
                previousEventId,
            });
        }
        else {
            webinar.joinLink = webinar.joinLink || undefined;
            webinar.googleCalendarEventId = webinar.googleCalendarEventId || undefined;
            yield applyDraftCalendarState(webinar);
        }
        yield webinar.save();
        return res.status(200).json({
            message: webinar.isActive ? 'Webinar updated successfully.' : 'Webinar draft updated successfully.',
            webinar: yield getAdminWebinarById(String(webinar._id)),
        });
    }
    catch (error) {
        console.error('Updating webinar failed:', error);
        return res.status(500).json({ message: (error === null || error === void 0 ? void 0 : error.message) || 'Failed to update webinar.' });
    }
});
exports.updateWebinar = updateWebinar;
