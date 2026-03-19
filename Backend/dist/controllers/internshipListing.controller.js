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
exports.deleteInternship = exports.updateInternship = exports.createInternship = exports.getAdminInternships = exports.getInternshipBySlug = exports.getPublicInternships = void 0;
const internshipListing_model_1 = __importDefault(require("../models/internshipListing.model"));
const slugify = (value) => value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
const parseTags = (value) => {
    if (Array.isArray(value)) {
        return value.map((tag) => String(tag).trim()).filter(Boolean);
    }
    if (typeof value !== 'string') {
        return [];
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return [];
    }
    if (trimmed.startsWith('[')) {
        try {
            const parsedValue = JSON.parse(trimmed);
            if (Array.isArray(parsedValue)) {
                return parsedValue.map((tag) => String(tag).trim()).filter(Boolean);
            }
        }
        catch (error) {
            console.warn('Failed to parse internship tags JSON:', error);
        }
    }
    return trimmed
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
};
const parsePrice = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
};
const parseIsActive = (value) => {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string')
        return value.trim().toLowerCase() !== 'false';
    return true;
};
const buildInternshipPayload = (body) => {
    var _a, _b, _c, _d, _e;
    const title = String((_a = body.title) !== null && _a !== void 0 ? _a : '').trim();
    const shortDescription = String((_b = body.shortDescription) !== null && _b !== void 0 ? _b : '').trim();
    const description = String((_c = body.description) !== null && _c !== void 0 ? _c : '').trim();
    const duration = String((_d = body.duration) !== null && _d !== void 0 ? _d : '').trim();
    const location = String((_e = body.location) !== null && _e !== void 0 ? _e : '').trim();
    const price = parsePrice(body.price);
    const tags = parseTags(body.tags);
    const isActive = parseIsActive(body.isActive);
    return {
        title,
        shortDescription,
        description,
        duration,
        location,
        price,
        tags,
        isActive,
    };
};
const validateInternshipPayload = (payload) => {
    const requiredFields = [
        ['title', payload.title],
        ['shortDescription', payload.shortDescription],
        ['description', payload.description],
        ['duration', payload.duration],
        ['location', payload.location],
    ];
    const missingField = requiredFields.find(([, value]) => !value);
    if (missingField) {
        return `${missingField[0]} is required.`;
    }
    if (payload.price === null) {
        return 'Please provide a valid internship price.';
    }
    return null;
};
const generateUniqueSlug = (title) => __awaiter(void 0, void 0, void 0, function* () {
    const baseSlug = slugify(title) || 'internship';
    let slug = baseSlug;
    let counter = 1;
    while (yield internshipListing_model_1.default.exists({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
    }
    return slug;
});
const getNextSortOrder = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const lastInternship = yield internshipListing_model_1.default.findOne().sort({ sortOrder: -1, createdAt: -1 }).select('sortOrder');
    return ((_a = lastInternship === null || lastInternship === void 0 ? void 0 : lastInternship.sortOrder) !== null && _a !== void 0 ? _a : 0) + 1;
});
const getPublicInternships = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const internships = yield internshipListing_model_1.default.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
        return res.status(200).json({ internships });
    }
    catch (error) {
        console.error('Fetching public internships failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internships.' });
    }
});
exports.getPublicInternships = getPublicInternships;
const getInternshipBySlug = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const internship = yield internshipListing_model_1.default.findOne({
            slug: String((_a = req.params.slug) !== null && _a !== void 0 ? _a : '').trim().toLowerCase(),
            isActive: true,
        });
        if (!internship) {
            return res.status(404).json({ message: 'Internship not found.' });
        }
        return res.status(200).json({ internship });
    }
    catch (error) {
        console.error('Fetching internship by slug failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship.' });
    }
});
exports.getInternshipBySlug = getInternshipBySlug;
const getAdminInternships = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const internships = yield internshipListing_model_1.default.find().sort({ sortOrder: 1, createdAt: 1 });
        return res.status(200).json({ internships });
    }
    catch (error) {
        console.error('Fetching admin internships failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internships.' });
    }
});
exports.getAdminInternships = getAdminInternships;
const createInternship = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = buildInternshipPayload(req.body);
        const validationError = validateInternshipPayload(payload);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }
        const normalizedPrice = payload.price;
        const internship = yield internshipListing_model_1.default.create(Object.assign(Object.assign({}, payload), { price: normalizedPrice, slug: yield generateUniqueSlug(payload.title), sortOrder: yield getNextSortOrder() }));
        return res.status(201).json({
            message: 'Internship created successfully.',
            internship,
        });
    }
    catch (error) {
        console.error('Creating internship failed:', error);
        return res.status(500).json({ message: 'Failed to create internship.' });
    }
});
exports.createInternship = createInternship;
const updateInternship = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const internship = yield internshipListing_model_1.default.findById(req.params.id);
        if (!internship) {
            return res.status(404).json({ message: 'Internship not found.' });
        }
        const payload = buildInternshipPayload(req.body);
        const validationError = validateInternshipPayload(payload);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }
        const normalizedPrice = payload.price;
        internship.set(Object.assign(Object.assign({}, payload), { price: normalizedPrice }));
        yield internship.save();
        return res.status(200).json({
            message: 'Internship updated successfully.',
            internship,
        });
    }
    catch (error) {
        console.error('Updating internship failed:', error);
        return res.status(500).json({ message: 'Failed to update internship.' });
    }
});
exports.updateInternship = updateInternship;
const deleteInternship = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const internship = yield internshipListing_model_1.default.findById(req.params.id);
        if (!internship) {
            return res.status(404).json({ message: 'Internship not found.' });
        }
        yield internship.deleteOne();
        return res.status(200).json({ message: 'Internship deleted successfully.' });
    }
    catch (error) {
        console.error('Deleting internship failed:', error);
        return res.status(500).json({ message: 'Failed to delete internship.' });
    }
});
exports.deleteInternship = deleteInternship;
