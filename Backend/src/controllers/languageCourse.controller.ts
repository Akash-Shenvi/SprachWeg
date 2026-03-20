import { Request, Response } from 'express';
import LanguageCourse from '../models/languageCourse.model';

const parseStartingPrice = (value: unknown) => {
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

export const getAllLanguages = async (req: Request, res: Response) => {
    try {
        const languages = await LanguageCourse.find().sort({ createdAt: -1 });
        res.status(200).json(languages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching language courses', error });
    }
};

export const getLanguageById = async (req: Request, res: Response) => {
    try {
        const language = await LanguageCourse.findById(req.params.id);
        if (!language) {
            res.status(404).json({ message: 'Language course not found' });
            return;
        }
        res.status(200).json(language);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching language course', error });
    }
};

export const createLanguage = async (req: Request, res: Response) => {
    try {
        const { title, subtitle, description, popular, levels, image, startingPrice } = req.body;

        let parsedLevels = levels;
        // If levels are sent as a JSON string (e.g. from FormData), parse them
        if (typeof levels === 'string') {
            try {
                parsedLevels = JSON.parse(levels);
            } catch (e) {
                // keep as is if not json
            }
        }

        const normalizedStartingPrice = parseStartingPrice(startingPrice);
        if (normalizedStartingPrice === null) {
            return res.status(400).json({ message: 'Please provide a valid language starting price.' });
        }

        const newLanguage = new LanguageCourse({
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

        await newLanguage.save();
        res.status(201).json(newLanguage);
    } catch (error) {
        console.error("Error creating language course:", error);
        res.status(500).json({ message: 'Error creating language course', error });
    }
};

export const updateLanguage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        const rawStartingPrice = Object.prototype.hasOwnProperty.call(req.body, 'startingPrice')
            ? req.body.startingPrice
            : undefined;

        if (typeof updates.levels === 'string') {
            try {
                updates.levels = JSON.parse(updates.levels);
            } catch (e) {
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
            } else {
                updates.startingPrice = normalizedStartingPrice;
            }
        }

        const updatedLanguage = await LanguageCourse.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedLanguage) {
            res.status(404).json({ message: 'Language course not found' });
            return;
        }

        res.status(200).json(updatedLanguage);
    } catch (error) {
        console.error("Error updating language course:", error);
        res.status(500).json({ message: 'Error updating language course', error });
    }
};

export const deleteLanguage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedLanguage = await LanguageCourse.findByIdAndDelete(id);

        if (!deletedLanguage) {
            res.status(404).json({ message: 'Language course not found' });
            return;
        }

        res.status(200).json({ message: 'Language course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting language course', error });
    }
};
