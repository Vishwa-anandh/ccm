import React from "react";
import { useNavigate } from "react-router-dom";
import UploadInvoiceForm from "../../components/billing/UploadInvoiceForm";

/**
 * GenerateInvoicePage — /billing/generate ("Upload Invoice"), the
 * standalone route (e.g. a direct link opened in a new tab). The Billing
 * page's own "Upload Invoice" button instead opens this same workflow as
 * a popup (UploadInvoiceModal.jsx) — both host UploadInvoiceForm, which
 * holds all the actual upload/review/send logic.
 */
const GenerateInvoicePage = () => {
  const navigate = useNavigate();

  return (
    <UploadInvoiceForm
      onClose={() => navigate("/billing")}
      onCreated={(invoiceId) => navigate("/billing", { state: { selectedInvoiceId: invoiceId } })}
    />
  );
};

export default GenerateInvoicePage;
