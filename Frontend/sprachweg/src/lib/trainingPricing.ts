type MaybePrice = string | number | null | undefined;

type LevelWithPrice = {
    price?: MaybePrice;
};

type CourseWithPrice = {
    startingPrice?: MaybePrice;
    price?: MaybePrice;
    levels?: LevelWithPrice[];
};

export const extractNumericPrice = (value: MaybePrice): number | null => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== 'string') {
        return null;
    }

    const normalizedValue = value.replace(/[^0-9.]/g, '');
    if (!normalizedValue) {
        return null;
    }

    const numericValue = Number(normalizedValue);
    return Number.isFinite(numericValue) ? numericValue : null;
};

export const formatTrainingPrice = (value: MaybePrice, currency: string = 'INR') => {
    const numericValue = extractNumericPrice(value);

    if (numericValue === null) {
        return 'Contact for pricing';
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(numericValue);
};

export const getCourseStartingPrice = (course?: CourseWithPrice | null) => {
    const directPrice = extractNumericPrice(course?.startingPrice ?? course?.price);
    if (directPrice !== null) {
        return directPrice;
    }

    const levelPrices = Array.isArray(course?.levels)
        ? course.levels
            .map((level) => extractNumericPrice(level?.price))
            .filter((price): price is number => price !== null)
        : [];

    if (levelPrices.length === 0) {
        return null;
    }

    return Math.min(...levelPrices);
};
