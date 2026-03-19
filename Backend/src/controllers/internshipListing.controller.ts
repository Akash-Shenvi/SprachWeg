import { Request, Response } from 'express';
import InternshipListing from '../models/internshipListing.model';

const slugify = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');

const parseTags = (value: unknown): string[] => {
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
        } catch (error) {
            console.warn('Failed to parse internship tags JSON:', error);
        }
    }

    return trimmed
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
};

const parsePrice = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
};

const parseIsActive = (value: unknown) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.trim().toLowerCase() !== 'false';
    return true;
};

const buildInternshipPayload = (body: Request['body']) => {
    const title = String(body.title ?? '').trim();
    const shortDescription = String(body.shortDescription ?? '').trim();
    const description = String(body.description ?? '').trim();
    const duration = String(body.duration ?? '').trim();
    const location = String(body.location ?? '').trim();
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

const validateInternshipPayload = (payload: ReturnType<typeof buildInternshipPayload>) => {
    const requiredFields = [
        ['title', payload.title],
        ['shortDescription', payload.shortDescription],
        ['description', payload.description],
        ['duration', payload.duration],
        ['location', payload.location],
    ] as const;

    const missingField = requiredFields.find(([, value]) => !value);
    if (missingField) {
        return `${missingField[0]} is required.`;
    }

    if (payload.price === null) {
        return 'Please provide a valid internship price.';
    }

    return null;
};

const generateUniqueSlug = async (title: string) => {
    const baseSlug = slugify(title) || 'internship';
    let slug = baseSlug;
    let counter = 1;

    while (await InternshipListing.exists({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
    }

    return slug;
};

const getNextSortOrder = async () => {
    const lastInternship = await InternshipListing.findOne().sort({ sortOrder: -1, createdAt: -1 }).select('sortOrder');
    return (lastInternship?.sortOrder ?? 0) + 1;
};

export const getPublicInternships = async (_req: Request, res: Response) => {
    try {
        const internships = await InternshipListing.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
        return res.status(200).json({ internships });
    } catch (error) {
        console.error('Fetching public internships failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internships.' });
    }
};

export const getInternshipBySlug = async (req: Request, res: Response) => {
    try {
        const internship = await InternshipListing.findOne({
            slug: String(req.params.slug ?? '').trim().toLowerCase(),
            isActive: true,
        });

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found.' });
        }

        return res.status(200).json({ internship });
    } catch (error) {
        console.error('Fetching internship by slug failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship.' });
    }
};

export const getAdminInternships = async (_req: Request, res: Response) => {
    try {
        const internships = await InternshipListing.find().sort({ sortOrder: 1, createdAt: 1 });
        return res.status(200).json({ internships });
    } catch (error) {
        console.error('Fetching admin internships failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internships.' });
    }
};

export const createInternship = async (req: Request, res: Response) => {
    try {
        const payload = buildInternshipPayload(req.body);
        const validationError = validateInternshipPayload(payload);

        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const normalizedPrice = payload.price as number;

        const internship = await InternshipListing.create({
            ...payload,
            price: normalizedPrice,
            slug: await generateUniqueSlug(payload.title),
            sortOrder: await getNextSortOrder(),
        });

        return res.status(201).json({
            message: 'Internship created successfully.',
            internship,
        });
    } catch (error) {
        console.error('Creating internship failed:', error);
        return res.status(500).json({ message: 'Failed to create internship.' });
    }
};

export const updateInternship = async (req: Request, res: Response) => {
    try {
        const internship = await InternshipListing.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found.' });
        }

        const payload = buildInternshipPayload(req.body);
        const validationError = validateInternshipPayload(payload);

        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const normalizedPrice = payload.price as number;

        internship.set({
            ...payload,
            price: normalizedPrice,
        });

        await internship.save();

        return res.status(200).json({
            message: 'Internship updated successfully.',
            internship,
        });
    } catch (error) {
        console.error('Updating internship failed:', error);
        return res.status(500).json({ message: 'Failed to update internship.' });
    }
};

export const deleteInternship = async (req: Request, res: Response) => {
    try {
        const internship = await InternshipListing.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found.' });
        }

        await internship.deleteOne();

        return res.status(200).json({ message: 'Internship deleted successfully.' });
    } catch (error) {
        console.error('Deleting internship failed:', error);
        return res.status(500).json({ message: 'Failed to delete internship.' });
    }
};
