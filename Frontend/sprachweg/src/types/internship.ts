export interface InternshipListing {
    _id: string;
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    responsibilities?: string[];
    benefits?: string[];
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
    responsibilities: string[];
    benefits: string[];
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

const normalizeList = (items?: string[]) =>
    Array.isArray(items)
        ? items.map((item) => String(item).trim()).filter(Boolean)
        : [];

export const getInternshipResponsibilities = (internship: InternshipListing) => {
    const storedResponsibilities = normalizeList(internship.responsibilities);

    if (storedResponsibilities.length > 0) {
        return storedResponsibilities;
    }

    return [
        'Work on guided project tasks aligned with the internship track.',
        'Collaborate with mentors and improve your work through structured reviews.',
        'Document progress, complete milestones, and stay aligned with delivery timelines.',
    ];
};

export const getInternshipBenefits = (internship: InternshipListing) => {
    const storedBenefits = normalizeList(internship.benefits);

    if (storedBenefits.length > 0) {
        return storedBenefits;
    }

    const focusArea = internship.tags.length > 0
        ? internship.tags.slice(0, 3).join(', ')
        : 'industry tools and workflows';

    return [
        `Hands-on exposure through a ${internship.duration} structured internship.`,
        `Practical learning across ${focusArea}.`,
        'Professional mentorship with project-based experience you can speak about confidently.',
    ];
};
