export interface InternshipListing {
    _id: string;
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    duration: string;
    location: string;
    price: number;
    currency?: string;
    tags: string[];
    isActive: boolean;
    sortOrder?: number;
    createdAt: string;
    updatedAt: string;
}

export interface InternshipPayload {
    title: string;
    shortDescription: string;
    description: string;
    duration: string;
    location: string;
    price: number;
    tags: string[];
    isActive: boolean;
}

export const formatInternshipPrice = (price?: number, currency: string = 'INR') => {
    if (typeof price !== 'number' || Number.isNaN(price)) {
        return 'Contact for pricing';
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(price);
};

export const slugifyInternshipTitle = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
