"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDisplayPaymentPricing = exports.buildPaymentPricingBreakdown = exports.GST_PERCENTAGE = exports.GST_RATE = void 0;
exports.GST_RATE = 0.18;
exports.GST_PERCENTAGE = 18;
const buildPaymentPricingBreakdown = (baseAmountInSubunits) => {
    const normalizedBaseAmount = Math.max(0, Math.round(Number(baseAmountInSubunits) || 0));
    const gstAmount = Math.round(normalizedBaseAmount * exports.GST_RATE);
    return {
        baseAmount: normalizedBaseAmount,
        gstAmount,
        totalAmount: normalizedBaseAmount + gstAmount,
    };
};
exports.buildPaymentPricingBreakdown = buildPaymentPricingBreakdown;
const toDisplayAmount = (subunits) => Number((subunits / 100).toFixed(2));
const buildDisplayPaymentPricing = (pricing) => ({
    baseAmount: toDisplayAmount(pricing.baseAmount),
    gstAmount: toDisplayAmount(pricing.gstAmount),
    totalAmount: toDisplayAmount(pricing.totalAmount),
    gstRate: exports.GST_PERCENTAGE,
});
exports.buildDisplayPaymentPricing = buildDisplayPaymentPricing;
