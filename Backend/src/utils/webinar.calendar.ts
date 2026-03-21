import User from '../models/user.model';
import WebinarRegistration from '../models/webinarRegistration.model';
import { GoogleCalendarService } from '../services/google.calendar.service';
import type { IWebinar } from '../models/webinar.model';

const WEBINAR_DURATION_MINUTES = 60;
const googleService = new GoogleCalendarService();

type TrainerWithCalendar = {
    _id: string;
    name: string;
    email: string;
    googleRefreshToken?: string;
} | null;

const formatWebinarPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency || 'INR',
        maximumFractionDigits: 0,
    }).format(price);

const buildWebinarSummary = (webinar: IWebinar) => `Webinar: ${webinar.title}`;

const buildWebinarDescription = (webinar: IWebinar) => {
    const sections = [
        webinar.shortDescription?.trim(),
        webinar.description?.trim(),
        `Scheduled for: ${webinar.scheduledAt.toISOString()}`,
        `Registration Fee: ${formatWebinarPrice(webinar.price, webinar.currency || 'INR')}`,
    ].filter(Boolean);

    return sections.join('\n\n');
};

export const getTrainerCalendarState = async (trainerId?: unknown) => {
    const normalizedTrainerId = String(trainerId ?? '').trim();
    if (!normalizedTrainerId) {
        return {
            trainer: null as TrainerWithCalendar,
            connected: false,
        };
    }

    const trainer = await User.findById(normalizedTrainerId)
        .select('name email role +googleRefreshToken')
        .lean();

    if (!trainer || trainer.role !== 'trainer') {
        return {
            trainer: null as TrainerWithCalendar,
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
};

export const getApprovedWebinarAttendeeEmails = async (webinarId: unknown) => {
    const registrations = await WebinarRegistration.find({
        webinarId: webinarId as any,
        status: 'accepted',
    }).populate('userId', 'email');

    return [...new Set(
        registrations
            .map((registration: any) => String(registration.userId?.email || '').trim().toLowerCase())
            .filter(Boolean)
    )];
};

export const syncWebinarCalendarEvent = async (
    webinar: IWebinar,
    options?: {
        previousTrainerId?: unknown;
        previousEventId?: string | null;
    }
) => {
    const trainerState = await getTrainerCalendarState(webinar.trainerId);

    if (!trainerState.trainer) {
        throw new Error('Please assign a valid trainer before publishing this webinar.');
    }

    if (!trainerState.connected || !trainerState.trainer.googleRefreshToken) {
        throw new Error('Assigned trainer must connect Google Calendar before publishing this webinar.');
    }

    const attendees = await getApprovedWebinarAttendeeEmails(webinar._id);
    const summary = buildWebinarSummary(webinar);
    const description = buildWebinarDescription(webinar);
    const previousTrainerId = String(options?.previousTrainerId ?? '').trim();
    const currentTrainerId = String(webinar.trainerId ?? '').trim();
    const previousEventId = String(options?.previousEventId ?? webinar.googleCalendarEventId ?? '').trim();

    googleService.setCredentials(trainerState.trainer.googleRefreshToken);

    if (previousEventId && previousTrainerId && previousTrainerId === currentTrainerId) {
        const updatedEvent = await googleService.updateMeeting(
            previousEventId,
            summary,
            description,
            webinar.scheduledAt,
            WEBINAR_DURATION_MINUTES,
            attendees
        );

        webinar.joinLink = updatedEvent.meetLink || webinar.joinLink || '';
        webinar.googleCalendarEventId = updatedEvent.eventId || previousEventId;
    } else {
        const createdEvent = await googleService.createMeeting(
            summary,
            description,
            webinar.scheduledAt,
            WEBINAR_DURATION_MINUTES,
            attendees
        );

        if (!createdEvent.meetLink) {
            throw new Error('Google Calendar did not return a valid meeting link for this webinar.');
        }

        webinar.joinLink = createdEvent.meetLink;
        webinar.googleCalendarEventId = createdEvent.eventId;

        if (previousEventId && previousTrainerId && previousTrainerId !== currentTrainerId) {
            const previousTrainerState = await getTrainerCalendarState(previousTrainerId);
            if (previousTrainerState.connected && previousTrainerState.trainer?.googleRefreshToken) {
                googleService.setCredentials(previousTrainerState.trainer.googleRefreshToken);
                await googleService.deleteEvent(previousEventId);
            }
        }
    }

    webinar.calendarSyncStatus = 'scheduled';
    webinar.calendarSyncError = undefined;
};
