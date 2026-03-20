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
exports.deleteLanguage = exports.updateLanguage = exports.createLanguage = exports.getLanguageById = exports.getAllLanguages = void 0;
const languageCourse_model_1 = __importDefault(require("../models/languageCourse.model"));
const parseStartingPrice = (value) => {
    if (typeof value === 'undefined' || value === null) {
        return undefined;
    }
    const trimmedValue = String(value).trim();
    if (!trimmedValue) {
        return undefined;
    }
    const numericValue = Number(trimmedValue);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
        return null;
    }
    return numericValue;
};
const getAllLanguages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const languages = yield languageCourse_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(languages);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching language courses', error });
    }
});
exports.getAllLanguages = getAllLanguages;
const getLanguageById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const language = yield languageCourse_model_1.default.findById(req.params.id);
        if (!language) {
            res.status(404).json({ message: 'Language course not found' });
            return;
        }
        res.status(200).json(language);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching language course', error });
    }
});
exports.getLanguageById = getLanguageById;
const createLanguage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, subtitle, description, popular, levels, image, startingPrice } = req.body;
        let parsedLevels = levels;
        // If levels are sent as a JSON string (e.g. from FormData), parse them
        if (typeof levels === 'string') {
            try {
                parsedLevels = JSON.parse(levels);
            }
            catch (e) {
                // keep as is if not json
            }
        }
        const normalizedStartingPrice = parseStartingPrice(startingPrice);
        if (normalizedStartingPrice === null) {
            return res.status(400).json({ message: 'Please provide a valid language starting price.' });
        }
        const newLanguage = new languageCourse_model_1.default({
            title,
            subtitle,
            description,
            popular,
            startingPrice: normalizedStartingPrice,
            levels: parsedLevels,
            image // Assuming image handling/upload is done via middleware or passed as string path
        });
        // specific handling if image was uploaded via multer and attached to req.file
        if (req.file) {
            newLanguage.image = req.file.filename;
        }
        else if (image && typeof image === 'string') {
            // If image is just a string (e.g. seed data or keeping existing), use it
            newLanguage.image = image;
        }
        yield newLanguage.save();
        res.status(201).json(newLanguage);
    }
    catch (error) {
        console.error("Error creating language course:", error);
        res.status(500).json({ message: 'Error creating language course', error });
    }
});
exports.createLanguage = createLanguage;
const updateLanguage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updates = Object.assign({}, req.body);
        const rawStartingPrice = Object.prototype.hasOwnProperty.call(req.body, 'startingPrice')
            ? req.body.startingPrice
            : undefined;
        if (typeof updates.levels === 'string') {
            try {
                updates.levels = JSON.parse(updates.levels);
            }
            catch (e) {
                // keep as is
            }
        }
        if (req.file) {
            updates.image = req.file.filename;
        }
        if (typeof rawStartingPrice !== 'undefined') {
            const normalizedStartingPrice = parseStartingPrice(rawStartingPrice);
            if (normalizedStartingPrice === null) {
                return res.status(400).json({ message: 'Please provide a valid language starting price.' });
            }
            if (typeof normalizedStartingPrice === 'undefined') {
                delete updates.startingPrice;
            }
            else {
                updates.startingPrice = normalizedStartingPrice;
            }
        }
        const updatedLanguage = yield languageCourse_model_1.default.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedLanguage) {
            res.status(404).json({ message: 'Language course not found' });
            return;
        }
        res.status(200).json(updatedLanguage);
    }
    catch (error) {
        console.error("Error updating language course:", error);
        res.status(500).json({ message: 'Error updating language course', error });
    }
});
exports.updateLanguage = updateLanguage;
const deleteLanguage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deletedLanguage = yield languageCourse_model_1.default.findByIdAndDelete(id);
        if (!deletedLanguage) {
            res.status(404).json({ message: 'Language course not found' });
            return;
        }
        res.status(200).json({ message: 'Language course deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting language course', error });
    }
});
exports.deleteLanguage = deleteLanguage;
