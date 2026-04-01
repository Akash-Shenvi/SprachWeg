import React from 'react';
import { Building2 } from 'lucide-react';
import { getAssetUrl } from '../../lib/api';

interface InstitutionStudentHeaderProps {
    institutionName?: string;
    institutionLogo?: string;
    institutionTagline?: string;
    studentName?: string;
    className?: string;
}

const InstitutionStudentHeader: React.FC<InstitutionStudentHeaderProps> = ({
    institutionName,
    institutionLogo,
    institutionTagline,
    studentName,
    className = '',
}) => {
    const displayName = institutionName || 'Institution Portal';

    return (
        <section className={`relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#12284a] to-[#1d4f6b] text-white ${className}`.trim()}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,177,97,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_25%)]" />
            <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <div className="flex items-center gap-4">
                    <div className="flex h-18 w-18 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur">
                        {institutionLogo ? (
                            <img
                                src={getAssetUrl(institutionLogo)}
                                alt={displayName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <Building2 className="h-8 w-8 text-[#f0d79a]" />
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f0d79a]">Institution Training Portal</p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{displayName}</h1>
                        {institutionTagline ? (
                            <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">{institutionTagline}</p>
                        ) : null}
                    </div>
                </div>

                {studentName ? (
                    <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Welcome</p>
                        <p className="mt-2 text-lg font-semibold text-white">{studentName}</p>
                    </div>
                ) : null}
            </div>
        </section>
    );
};

export default InstitutionStudentHeader;
