import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import InvoicePreview from "../invoice-builder/InvoicePreview";

/**
 * InvoiceDocument — renders a *saved* Customer Invoice through the same
 * InvoicePreview component the builder's live preview uses, mapping the
 * stored invoice shape (demoBackend.js's calcLine()-derived lines,
 * finalLineAmount etc.) back into InvoicePreview's props (quantity/
 * unitPrice/discountPct rows). This is the actual branded document that
 * was emailed — not the MetaChip/KPI summary CustomerInvoiceDetail shows
 * — used by the Billing page's "View Invoice" toggle.
 */
const InvoiceDocument = forwardRef(({ invoice, customer }, ref) => {
  const rows = (invoice.lines ?? []).map((line, i) => ({
    id: `line-${line.lineNumber ?? i}`,
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.vendorUnitPrice,
    discountPct: line.discountPctApplied ?? 0,
    extra: line.extra ?? {},
  }));

  return (
    <InvoicePreview
      ref={ref}
      invoiceNumber={invoice.invoiceNumber}
      invoiceDate={invoice.invoiceDate}
      serialNumber={invoice.serialNumber}
      poNumber={invoice.poNumber}
      billingPeriodStart={invoice.billingPeriodStart}
      billingPeriodEnd={invoice.billingPeriodEnd}
      dueDate={invoice.dueDate}
      paymentTermName={invoice.paymentTermName}
      billTo={{
        name: customer?.name ?? "",
        address: customer?.billingAddress ?? "",
        email: customer?.primaryContactEmail ?? "",
      }}
      shipTo={{ address: customer?.shippingAddress ?? "" }}
      customFields={invoice.customFields ?? []}
      columns={invoice.columns ?? []}
      rows={rows}
      taxPct={invoice.taxPct ?? 0}
      overallAdjustmentPct={invoice.overallAdjustmentPct ?? 0}
      notes=""
      template={invoice.template}
      logo={invoice.logo}
    />
  );
});

InvoiceDocument.displayName = "InvoiceDocument";

InvoiceDocument.propTypes = {
  invoice: PropTypes.object.isRequired,
  customer: PropTypes.object,
};

export default InvoiceDocument;
