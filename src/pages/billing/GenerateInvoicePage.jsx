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
      // `replace: true` — leaving the builder swaps this history entry for
      // /billing rather than pushing a new one on top of it. Without this,
      // a lingering /billing/generate entry sits in history (now with its
      // parsed state already cleared, above), and pressing the browser's
      // own Back button from /billing lands back on that stale, empty
      // upload screen instead of wherever the user actually came from.
      onClose={() => navigate("/billing", { replace: true })}
      onCreated={(invoiceId) => navigate("/billing", { replace: true, state: { selectedInvoiceId: invoiceId } })}
      initialParsed={location.state?.parsed ?? null}
    />
  );
};

export default GenerateInvoicePage;
