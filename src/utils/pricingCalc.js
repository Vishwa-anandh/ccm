/**
 * pricingCalc — the Customer Invoice line-item pricing engine.
 *
 * Implements the formula from the "Maitsys CCM Invoicing Requirement
 * Document" (Section 8 — Calculation Logic):
 *
 *   Vendor Line Total   = Quantity × Vendor Unit Price      (already extracted)
 *   Discount Amount     = Vendor Line Total × Discount %    (0% is a valid, explicit value)
 *   Net After Discount  = Vendor Line Total − Discount Amount
 *   Adjustment Amount   = Net After Discount × Maitsys Adjustment %
 *   Final Line Amount   = Net After Discount + Adjustment Amount
 *
 * A Pricing Rule's "Calculation Order" can instead apply the Maitsys
 * Adjustment first and the discount second — the two percentages are
 * always applied one after the other, each against the *previous* step's
 * result, never both against the original Vendor Line Total. Rounding
 * happens to 2 decimals at every step (an explicit choice — the source
 * document leaves this open; see the plan's Assumptions section).
 */

export const CALC_ORDERS = {
  DISCOUNT_THEN_ADJUSTMENT: "discount_then_adjustment",
  ADJUSTMENT_THEN_DISCOUNT: "adjustment_then_discount",
};

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Calculates one Customer Invoice line item from its extracted vendor
 * values and a Pricing Rule's percentages.
 *
 * @param {object} params
 * @param {number} params.quantity
 * @param {number} params.vendorUnitPrice
 * @param {number} [params.vendorLineTotal] — pass explicitly if it's already
 *   known (e.g. extracted straight from the vendor invoice); otherwise
 *   derived as quantity × vendorUnitPrice.
 * @param {number} params.discountPct — 0–100, 0 is a valid explicit value.
 * @param {number} params.adjustmentPct — 0–100.
 * @param {string} [params.order] — one of CALC_ORDERS, defaults to discount-then-adjustment.
 */
export function calcLine({
  quantity,
  vendorUnitPrice,
  vendorLineTotal,
  discountPct,
  adjustmentPct,
  order = CALC_ORDERS.DISCOUNT_THEN_ADJUSTMENT,
}) {
  const qty = Number(quantity ?? 1);
  const unitPrice = Number(vendorUnitPrice ?? 0);
  const lineTotal = round2(vendorLineTotal ?? qty * unitPrice);
  const dPct = Number(discountPct ?? 0);
  const aPct = Number(adjustmentPct ?? 0);

  let discountAmount;
  let netAfterDiscount;
  let adjustmentAmount;
  let finalLineAmount;

  if (order === CALC_ORDERS.ADJUSTMENT_THEN_DISCOUNT) {
    // Adjustment first, against the vendor line total; discount second,
    // against the amount after adjustment.
    adjustmentAmount = round2(lineTotal * (aPct / 100));
    const netAfterAdjustment = round2(lineTotal + adjustmentAmount);
    discountAmount = round2(netAfterAdjustment * (dPct / 100));
    netAfterDiscount = round2(netAfterAdjustment - discountAmount);
    finalLineAmount = netAfterDiscount;
  } else {
    // Default: discount first, adjustment second (matches the doc's worked example).
    discountAmount = round2(lineTotal * (dPct / 100));
    netAfterDiscount = round2(lineTotal - discountAmount);
    adjustmentAmount = round2(netAfterDiscount * (aPct / 100));
    finalLineAmount = round2(netAfterDiscount + adjustmentAmount);
  }

  return {
    quantity: qty,
    vendorUnitPrice: unitPrice,
    vendorLineTotal: lineTotal,
    discountPctApplied: dPct,
    discountAmount,
    netAmountAfterDiscount: netAfterDiscount,
    maitsysAdjustmentPctApplied: aPct,
    maitsysAdjustmentAmount: adjustmentAmount,
    finalLineAmount,
  };
}

/**
 * Recalculates every line, then rolls the invoice-level Subtotal / Tax /
 * Total Due. Tax is applied once, on the summed Final Line Amounts (i.e.
 * after every line's discount + adjustment) — see the plan's Assumptions.
 *
 * @param {Array} lines — each with the fields calcLine() returns (or raw
 *   quantity/vendorUnitPrice/discountPct/adjustmentPct to be recalculated).
 * @param {number} taxPct
 * @param {string} [order]
 */
export function calcInvoiceTotals(lines, taxPct, order) {
  const calculatedLines = lines.map((line) =>
    line.finalLineAmount != null && line.__recalculate !== true
      ? line
      : {
          ...line,
          ...calcLine({
            quantity: line.quantity,
            vendorUnitPrice: line.vendorUnitPrice,
            vendorLineTotal: line.vendorLineTotal,
            discountPct: line.discountPctApplied,
            adjustmentPct: line.maitsysAdjustmentPctApplied,
            order,
          }),
        },
  );

  const subtotal = round2(
    calculatedLines.reduce((s, l) => s + l.finalLineAmount, 0),
  );
  const tax = round2(subtotal * (Number(taxPct ?? 0) / 100));
  const totalDue = round2(subtotal + tax);

  return { lines: calculatedLines, subtotal, tax, totalDue };
}
