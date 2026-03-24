import { extractNumericPrice } from './trainingPricing';

export const GST_RATE = 0.18;
export const GST_PERCENTAGE = 18;

const formatAmount = (amount: number, currency: string = 'INR') =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

export const buildPaymentBreakdown = (value: string | number | null | undefined, currency: string = 'INR') => {
    const baseAmount = extractNumericPrice(value);

    if (baseAmount === null || baseAmount < 0) {
        return null;
    }

    const gstAmount = Number((baseAmount * GST_RATE).toFixed(2));
    const totalAmount = Number((baseAmount + gstAmount).toFixed(2));

    return {
        currency,
        baseAmount,
        gstAmount,
        totalAmount,
        gstRate: GST_PERCENTAGE,
        formattedBaseAmount: formatAmount(baseAmount, currency),
        formattedGstAmount: formatAmount(gstAmount, currency),
        formattedTotalAmount: formatAmount(totalAmount, currency),
    };
};
