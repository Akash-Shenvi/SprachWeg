import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Webinar from '../models/webinar.model';
import WebinarRegistration from '../models/webinarRegistration.model';
import User from '../models/user.model';
import { getTrainerCalendarState, syncWebinarCalendarEvent } from '../utils/webinar.calendar';

const slugify = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');

const parsePrice = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
};

const parseScheduledAt = (value: unknown) => {
    const normalizedValue = String(value ?? '').trim();
    if (!normalizedValue) {
        return null;
    }

    const parsedDate = new Date(normalizedValue);
    return Number.isFinite(parsedDate.getTime()) ? parsedDate : null;
};

const parseIsActive = (value: unknown) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.trim().toLowerCase() !== 'false';
    return true;
};

const buildWebinarPayload = (body: Request['body']) => {
    const title = String(body.title ?? '').trim();
    const shortDescription = String(body.shortDescription ?? '').trim();
    const description = String(body.description ?? '').trim();
    const trainerId = String(body.trainerId ?? '').trim();
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

const validateWebinarPayload = (payload: ReturnType<typeof buildWebinarPayload>) => {
    if (!payload.title) return 'title is required.';
    if (!payload.shortDescription) return 'shortDescription is required.';
    if (!payload.description) return 'description is required.';
    if (!payload.trainerId) return 'trainerId is required.';
    if (!payload.scheduledAt) return 'Please provide a valid webinar date and time.';
    if (payload.price === null) return 'Please provide a valid webinar price.';
    return null;
};

const generateUniqueSlug = async (title: string, webinarId?: string) => {
    const baseSlug = slugify(title) || 'webinar';
    let slug = baseSlug;
    let counter = 1;

    while (await Webinar.exists({ slug, _id: { $ne: webinarId } })) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
    }

    return slug;
};

const getNextSortOrder = async () => {
    const lastWebinar = await Webinar.findOne().sort({ sortOrder: -1, createdAt: -1 }).select('sortOrder');
    return (lastWebinar?.sortOrder ?? 0) + 1;
};

const getApprovedRegistrationCounts = async (webinarIds: string[]) => {
    if (webinarIds.length === 0) {
        return new Map<string, number>();
    }

    const counts = await WebinarRegistration.aggregate([
        {
            $match: {
                webinarId: { $in: webinarIds.map((id) => new mongoose.Types.ObjectId(id)) },
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

    return new Map<string, number>(
        counts.map((entry) => [String(entry._id), Number(entry.count || 0)])
    );
};

const getTrainerSummaries = async (trainerIds: string[]) => {
    if (trainerIds.length === 0) {
        return new Map<string, { _id: string; name: string; email: string; googleCalendarConnected: boolean }>();
    }

    const trainers = await User.find({
        _id: { $in: trainerIds },
        role: 'trainer',
    })
        .select('name email +googleRefreshToken')
        .lean();

    return new Map(
        trainers.map((trainer: any) => [
            String(trainer._id),
            {
                _id: String(trainer._id),
                name: String(trainer.name || '').trim(),
                email: String(trainer.email || '').trim(),
                googleCalendarConnected: !!trainer.googleRefreshToken,
            },
        ])
    );
};

const serializeWebinars = async (webinars: any[]) => {
    const webinarIds = webinars.map((webinar) => String(webinar._id));
    const trainerIds = [...new Set(webinars.map((webinar) => String(webinar.trainerId || '').trim()).filter(Boolean))];
    const [approvedCounts, trainerMap] = await Promise.all([
        getApprovedRegistrationCounts(webinarIds),
        getTrainerSummaries(trainerIds),
    ]);

    return webinars.map((webinar) => {
        const trainerId = String(webinar.trainerId || '').trim();
        const trainer = trainerMap.get(trainerId) || null;

        return {
            ...webinar,
            trainer,
            calendarReady: !!trainer?.googleCalendarConnected,
            approvedRegistrationsCount: approvedCounts.get(String(webinar._id)) || 0,
        };
    });
};

const getAcceptedRegistrationCount = async (webinarId: unknown) =>
    WebinarRegistration.countDocuments({
        webinarId: webinarId as any,
        status: 'accepted',
    });

const applyDraftCalendarState = async (webinar: any) => {
    const trainerState = await getTrainerCalendarState(webinar.trainerId);

    webinar.calendarSyncStatus = trainerState.connected ? 'draft' : 'needs_trainer_connection';
    webinar.calendarSyncError = trainerState.connected
        ? undefined
        : 'Assigned trainer must connect Google Calendar before publishing this webinar.';
};

const shouldSyncCalendarForSave = async (
    webinar: any,
    options?: {
        hadExistingEvent?: boolean;
        acceptedRegistrationCount?: number;
    }
) => {
    const acceptedRegistrationCount = options?.acceptedRegistrationCount ?? await getAcceptedRegistrationCount(webinar._id);
    return webinar.isActive || !!options?.hadExistingEvent || acceptedRegistrationCount > 0;
};

const findTrainerValidationError = async (trainerId: string, isActive: boolean) => {
    const trainerState = await getTrainerCalendarState(trainerId);

    if (!trainerState.trainer) {
        return 'Please assign a valid trainer to this webinar.';
    }

    if (isActive && !trainerState.connected) {
        return 'Assigned trainer must connect Google Calendar before publishing this webinar.';
    }

    return null;
};

const getAdminWebinarById = async (webinarId: string) => {
    const webinar = await Webinar.findById(webinarId).lean();
    if (!webinar) {
        return null;
    }

    const [serialized] = await serializeWebinars([webinar]);
    return serialized;
};

export const getPublicWebinars = async (_req: Request, res: Response) => {
    try {
        const webinars = await Webinar.find({ isActive: true })
            .select('-joinLink -trainerId -googleCalendarEventId -calendarSyncStatus -calendarSyncError')
            .sort({ sortOrder: 1, createdAt: 1 })
            .lean();

        return res.status(200).json({ webinars });
    } catch (error) {
        console.error('Fetching public webinars failed:', error);
        return res.status(500).json({ message: 'Failed to fetch webinars.' });
    }
};

export const getWebinarBySlug = async (req: Request, res: Response) => {
    try {
        const webinar = await Webinar.findOne({
            slug: String(req.params.slug ?? '').trim().toLowerCase(),
            isActive: true,
        })
            .select('-joinLink -trainerId -googleCalendarEventId -calendarSyncStatus -calendarSyncError')
            .lean();

        if (!webinar) {
            return res.status(404).json({ message: 'Webinar not found.' });
        }

        return res.status(200).json({ webinar });
    } catch (error) {
        console.error('Fetching webinar by slug failed:', error);
        return res.status(500).json({ message: 'Failed to fetch webinar.' });
    }
};

export const getAdminWebinars = async (_req: Request, res: Response) => {
    try {
        const webinars = await Webinar.find()
            .sort({ sortOrder: 1, createdAt: 1 })
            .lean();

        return res.status(200).json({
            webinars: await serializeWebinars(webinars),
        });
    } catch (error) {
        console.error('Fetching admin webinars failed:', error);
        return res.status(500).json({ message: 'Failed to fetch webinars.' });
    }
};

export const getTrainerAssignedWebinars = async (req: Request, res: Response) => {
    try {
        const trainerId = String((req as any).user?._id ?? '').trim();
        const webinars = await Webinar.find({
            trainerId,
            scheduledAt: { $gte: new Date() },
        })
            .sort({ scheduledAt: 1, createdAt: 1 })
            .lean();

        const trainerState = await getTrainerCalendarState(trainerId);

        return res.status(200).json({
            trainerCalendarConnected: trainerState.connected,
            webinars: await serializeWebinars(webinars),
        });
    } catch (error) {
        console.error('Fetching trainer webinars failed:', error);
        return res.status(500).json({ message: 'Failed to fetch assigned webinars.' });
    }
};

export const createWebinar = async (req: Request, res: Response) => {
    try {
        const payload = buildWebinarPayload(req.body);
        const validationError = validateWebinarPayload(payload);

        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const trainerValidationError = await findTrainerValidationError(payload.trainerId, payload.isActive);
        if (trainerValidationError) {
            return res.status(400).json({ message: trainerValidationError });
        }

        const webinar = new Webinar({
            title: payload.title,
            shortDescription: payload.shortDescription,
            description: payload.description,
            trainerId: payload.trainerId,
            scheduledAt: payload.scheduledAt as Date,
            price: payload.price as number,
            isActive: payload.isActive,
            slug: await generateUniqueSlug(payload.title),
            sortOrder: await getNextSortOrder(),
        });

        if (await shouldSyncCalendarForSave(webinar, { hadExistingEvent: false, acceptedRegistrationCount: 0 })) {
            await syncWebinarCalendarEvent(webinar, {
                previousTrainerId: null,
                previousEventId: null,
            });
        } else {
            await applyDraftCalendarState(webinar);
        }

        await webinar.save();

        return res.status(201).json({
            message: webinar.isActive ? 'Webinar created and published successfully.' : 'Webinar draft saved successfully.',
            webinar: await getAdminWebinarById(String(webinar._id)),
        });
    } catch (error: any) {
        console.error('Creating webinar failed:', error);
        return res.status(500).json({ message: error?.message || 'Failed to create webinar.' });
    }
};

export const updateWebinar = async (req: Request, res: Response) => {
    try {
        const webinar = await Webinar.findById(req.params.id);

        if (!webinar) {
            return res.status(404).json({ message: 'Webinar not found.' });
        }

        const payload = buildWebinarPayload(req.body);
        const validationError = validateWebinarPayload(payload);

        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const acceptedRegistrationCount = await getAcceptedRegistrationCount(webinar._id);
        const hadExistingEvent = !!webinar.googleCalendarEventId;
        const previousTrainerId = webinar.trainerId;
        const previousEventId = webinar.googleCalendarEventId;

        const trainerValidationError = await findTrainerValidationError(
            payload.trainerId,
            payload.isActive || hadExistingEvent || acceptedRegistrationCount > 0
        );
        if (trainerValidationError) {
            return res.status(400).json({ message: trainerValidationError });
        }

        webinar.set({
            title: payload.title,
            shortDescription: payload.shortDescription,
            description: payload.description,
            trainerId: payload.trainerId,
            scheduledAt: payload.scheduledAt as Date,
            price: payload.price as number,
            isActive: payload.isActive,
            slug: await generateUniqueSlug(payload.title, String(webinar._id)),
        });

        if (await shouldSyncCalendarForSave(webinar, { hadExistingEvent, acceptedRegistrationCount })) {
            await syncWebinarCalendarEvent(webinar, {
                previousTrainerId,
                previousEventId,
            });
        } else {
            webinar.joinLink = webinar.joinLink || undefined;
            webinar.googleCalendarEventId = webinar.googleCalendarEventId || undefined;
            await applyDraftCalendarState(webinar);
        }

        await webinar.save();

        return res.status(200).json({
            message: webinar.isActive ? 'Webinar updated successfully.' : 'Webinar draft updated successfully.',
            webinar: await getAdminWebinarById(String(webinar._id)),
        });
    } catch (error: any) {
        console.error('Updating webinar failed:', error);
        return res.status(500).json({ message: error?.message || 'Failed to update webinar.' });
    }
};
