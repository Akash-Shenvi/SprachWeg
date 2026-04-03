import mongoose, { type ClientSession } from 'mongoose';
import LanguageBatch, { type IBatch } from '../models/language.batch.model';

export type LanguageInstitutionScope = {
    institutionId: mongoose.Types.ObjectId | null;
    institutionName: string | null;
};

const normalizeInstitutionId = (value: unknown): mongoose.Types.ObjectId | null => {
    if (!value) {
        return null;
    }

    if (value instanceof mongoose.Types.ObjectId) {
        return value;
    }

    if (typeof value === 'object' && value !== null && '_id' in (value as Record<string, unknown>)) {
        return normalizeInstitutionId((value as Record<string, unknown>)._id);
    }

    const normalizedValue = String(value).trim();
    if (!normalizedValue || !mongoose.Types.ObjectId.isValid(normalizedValue)) {
        return null;
    }

    return new mongoose.Types.ObjectId(normalizedValue);
};

const normalizeInstitutionName = (value: unknown) => {
    const normalizedValue = String(value ?? '').trim();
    return normalizedValue || null;
};

const normalizeRole = (value: unknown) => String(value ?? '').trim().toLowerCase();

export const getLanguageInstitutionScope = (params: {
    institutionId?: unknown;
    institutionName?: unknown;
}): LanguageInstitutionScope => {
    const institutionId = normalizeInstitutionId(params.institutionId);

    return {
        institutionId,
        institutionName: institutionId ? normalizeInstitutionName(params.institutionName) : null,
    };
};

export const getLanguageEnrollmentInstitutionScope = (user?: {
    role?: unknown;
    institutionId?: unknown;
    institutionName?: unknown;
} | null): LanguageInstitutionScope => {
    if (normalizeRole(user?.role) !== 'institution_student') {
        return {
            institutionId: null,
            institutionName: null,
        };
    }

    return getLanguageInstitutionScope({
        institutionId: user?.institutionId,
        institutionName: user?.institutionName,
    });
};

export const buildLanguageBatchQuery = (
    courseTitle: string,
    levelName: string,
    scope: LanguageInstitutionScope
) => ({
    courseTitle,
    name: levelName,
    institutionId: scope.institutionId,
});

export const applyLanguageInstitutionScope = <
    T extends { institutionId?: unknown; institutionName?: unknown }
>(
    target: T,
    scope: LanguageInstitutionScope
) => {
    target.institutionId = scope.institutionId;
    target.institutionName = scope.institutionId ? scope.institutionName : null;
    return target;
};

export const findOrCreateLanguageBatch = async (params: {
    courseTitle: string;
    levelName: string;
    scope: LanguageInstitutionScope;
    session?: ClientSession | null;
}) => {
    const batchQuery = LanguageBatch.findOne(
        buildLanguageBatchQuery(params.courseTitle, params.levelName, params.scope)
    );

    if (params.session) {
        batchQuery.session(params.session);
    }

    let batch = await batchQuery;

    if (!batch) {
        batch = new LanguageBatch({
            courseTitle: params.courseTitle,
            name: params.levelName,
            students: [],
        });

        applyLanguageInstitutionScope(batch as unknown as Record<string, unknown>, params.scope);

        if (params.session) {
            await batch.save({ session: params.session });
        } else {
            await batch.save();
        }

        return batch;
    }

    applyLanguageInstitutionScope(batch as unknown as Record<string, unknown>, params.scope);
    return batch;
};

export const buildLanguageBatchScopeLabel = (scope?: {
    institutionName?: unknown;
    institutionId?: unknown;
} | null) => {
    const normalizedScope = getLanguageInstitutionScope(scope || {});
    return normalizedScope.institutionName || 'General Pool';
};

export const isInstitutionScopedLanguageBatch = (batch?: IBatch | null) =>
    !!getLanguageInstitutionScope({
        institutionId: batch?.institutionId,
        institutionName: batch?.institutionName,
    }).institutionId;
