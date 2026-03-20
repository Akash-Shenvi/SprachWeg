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

export type InternshipMode = 'remote' | 'online' | 'hybrid' | 'onsite';

type CanonicalInternshipMode = Exclude<InternshipMode, 'online'>;

const INTERNSHIP_MODE_DEFINITIONS: Array<{
    value: CanonicalInternshipMode;
    label: string;
    aliases: string[];
}> = [
    { value: 'remote', label: 'Remote', aliases: ['remote', 'online'] },
    { value: 'hybrid', label: 'Hybrid', aliases: ['hybrid'] },
    { value: 'onsite', label: 'Onsite', aliases: ['onsite', 'on-site', 'on site'] },
];

export const normalizeInternshipMode = (value?: string): CanonicalInternshipMode | '' => {
    const normalizedValue = String(value ?? '').trim().toLowerCase();

    if (INTERNSHIP_MODE_DEFINITIONS[0].aliases.includes(normalizedValue)) {
        return 'remote';
    }

    if (INTERNSHIP_MODE_DEFINITIONS[1].aliases.includes(normalizedValue)) {
        return 'hybrid';
    }

    if (INTERNSHIP_MODE_DEFINITIONS[2].aliases.includes(normalizedValue)) {
        return 'onsite';
    }

    return '';
};

export const formatInternshipMode = (mode?: string) => {
    const normalizedMode = normalizeInternshipMode(mode);

    if (!normalizedMode) {
        return 'Not specified';
    }

    return INTERNSHIP_MODE_DEFINITIONS.find(({ value }) => value === normalizedMode)?.label || 'Not specified';
};

export const getInternshipModeOptions = (location?: string) => {
    const normalizedLocation = String(location ?? '').trim().toLowerCase();

    const matchedOptions = INTERNSHIP_MODE_DEFINITIONS.filter(({ aliases }) =>
        aliases.some((alias) => normalizedLocation.includes(alias))
    ).map(({ value, label }) => ({ value, label }));

    if (matchedOptions.length > 0) {
        return matchedOptions;
    }

    return INTERNSHIP_MODE_DEFINITIONS.map(({ value, label }) => ({ value, label }));
};

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
