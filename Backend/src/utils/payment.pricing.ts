export const GST_RATE = 0.18;
export const GST_PERCENTAGE = 18;

export type PaymentPricingBreakdown = {
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
};

export const buildPaymentPricingBreakdown = (baseAmountInSubunits: number): PaymentPricingBreakdown => {
    const normalizedBaseAmount = Math.max(0, Math.round(Number(baseAmountInSubunits) || 0));
    const gstAmount = Math.round(normalizedBaseAmount * GST_RATE);

    return {
        baseAmount: normalizedBaseAmount,
        gstAmount,
        totalAmount: normalizedBaseAmount + gstAmount,
    };
};

const toDisplayAmount = (subunits: number) => Number((subunits / 100).toFixed(2));

export const buildDisplayPaymentPricing = (pricing: PaymentPricingBreakdown) => ({
    baseAmount: toDisplayAmount(pricing.baseAmount),
    gstAmount: toDisplayAmount(pricing.gstAmount),
    totalAmount: toDisplayAmount(pricing.totalAmount),
    gstRate: GST_PERCENTAGE,
});
