import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UploadInvoiceForm from "../../components/billing/UploadInvoiceForm";

/**
 * GenerateInvoicePage — /billing/generate, the invoice builder page. The
 * Billing page's "Upload Invoice" button opens UploadInvoiceModal (a small
 * popup that only picks/parses the file(s)) then navigates here with the
 * parsed result already in hand (location.state.parsed), so this page
 * lands straight on the builder view — the popup never hosts the builder
 * itself. A direct visit to this route (no state, e.g. a bookmarked link)
 * still works: UploadInvoiceForm shows its own upload dropzone first.
 */
const GenerateInvoicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Consume the handed-off parsed data once — a later remount of this
  // page (e.g. browser back/forward) shouldn't keep re-applying stale
  // parsed rows from a previous visit.
  useEffect(() => {
    if (location.state?.parsed) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UploadInvoiceForm
      onClose={() => navigate("/billing")}
      onCreated={(invoiceId) => navigate("/billing", { state: { selectedInvoiceId: invoiceId } })}
      initialParsed={location.state?.parsed ?? null}
    />
  );
};

export default GenerateInvoicePage;
