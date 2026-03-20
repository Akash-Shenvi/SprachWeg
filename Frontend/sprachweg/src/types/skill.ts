export interface SkillCourse {
    _id?: string;
    title: string;
    subtitle?: string;
    level?: string;
    description: string;
    price?: string;
    startingPrice?: number;
    originalPrice?: string;
    rating?: string;
    students?: string;
    duration?: string;
    startDate?: string;
    mode?: string;
    popular?: boolean;
    features: string[];
    category: string;
    image?: string;
    levels?: {
        name: string;
        duration: string;
        price: string;
        features: string[];
        outcome: string;
        examPrep?: {
            title: string;
            details: string;
            price: string;
        };
    }[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateSkillCourseInput {
    title: string;
    subtitle?: string;
    level?: string;
    description: string;
    features: string[];
    category: string;
    price?: string;
    originalPrice?: string;
    rating?: string;
    students?: string;
    duration?: string;
    startDate?: string;
    mode?: string;
    popular?: boolean;
    image?: File;
}
