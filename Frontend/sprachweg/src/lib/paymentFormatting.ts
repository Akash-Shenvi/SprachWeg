export const formatPaymentState = (value?: string) => {
    const normalizedValue = String(value ?? '').trim().toLowerCase();

    if (!normalizedValue) return 'Not available';
    if (normalizedValue === 'paid') return 'Paid';
    if (normalizedValue === 'created') return 'Created';
    if (normalizedValue === 'failed') return 'Failed';
    if (normalizedValue === 'cancelled') return 'Cancelled';
    if (normalizedValue === 'captured') return 'Captured';
    if (normalizedValue === 'authorized') return 'Authorized';
    if (normalizedValue === 'refunded') return 'Refunded';

    return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1);
};
