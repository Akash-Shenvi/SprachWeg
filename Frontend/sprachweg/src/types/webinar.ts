export type WebinarCalendarSyncStatus = 'draft' | 'needs_trainer_connection' | 'scheduled' | 'sync_error';

export interface WebinarTrainerSummary {
    _id: string;
    name: string;
    email: string;
    googleCalendarConnected: boolean;
}

export interface WebinarListing {
    _id: string;
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    scheduledAt: string;
    price: number;
    trainerId?: string;
    trainer?: WebinarTrainerSummary | null;
    currency?: string;
    joinLink?: string;
    googleCalendarEventId?: string;
    calendarSyncStatus?: WebinarCalendarSyncStatus;
    calendarSyncError?: string;
    calendarReady?: boolean;
    isActive: boolean;
    approvedRegistrationsCount?: number;
    sortOrder?: number;
    createdAt: string;
    updatedAt: string;
}

export interface WebinarPayload {
    title: string;
    shortDescription: string;
    description: string;
    trainerId: string;
    scheduledAt: string;
    price: number;
    isActive: boolean;
}

export interface ApprovedWebinar {
    _id: string;
    webinarId: string;
    title: string;
    scheduledAt: string;
    joinLink: string | null;
    price: number;
    currency: string;
    referenceCode: string;
    status: 'accepted';
    createdAt: string;
}

export interface TrainerAssignedWebinarFeed {
    trainerCalendarConnected: boolean;
    webinars: WebinarListing[];
}

export const formatWebinarPrice = (price?: number, currency: string = 'INR') => {
    if (typeof price !== 'number' || Number.isNaN(price)) {
        return 'Contact for pricing';
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(price);
};

export const formatWebinarDateTime = (value?: string) => {
    if (!value) {
        return 'Date to be announced';
    }

    return new Date(value).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
