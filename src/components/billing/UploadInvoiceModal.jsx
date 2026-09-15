import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { X, FileStack, CloudUpload, RefreshCw, FileWarning } from "lucide-react";
import { parseInvoiceFile, mergeParsedInvoiceResults } from "../../utils/invoiceFileParser";
import { fireToast } from "../ToastProvider";

/**
 * UploadInvoiceModal — the Billing page's "Upload Invoice" button opens
 * this popup. It does exactly one thing: pick/drop one or more invoice
 * files and parse them. It never hosts the invoice builder itself — once
 * parsing succeeds, it closes and navigates to /billing/generate (the
 * full-page builder, GenerateInvoicePage.jsx/UploadInvoiceForm.jsx) with
 * the parsed result already in hand, so that page lands straight on the
 * review/edit/send view instead of showing its own dropzone again.
 */
const UploadInvoiceModal = ({ open, onClose }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape" && !uploading) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, uploading]);

  // Fresh each time it opens — a previous attempt's error shouldn't
  // linger the next time Finance opens this popup.
  useEffect(() => {
    if (open) setUploadError("");
  }, [open]);

  if (!open) return null;

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList ?? []).filter(Boolean);
    if (files.length === 0) return;
    setUploading(true);
    setUploadError("");
    const parsedResults = [];
    const failed = [];
    for (const file of files) {
      try {
        parsedResults.push(await parseInvoiceFile(file));
      } catch (err) {
        failed.push({ name: file.name, message: err.message || "Couldn't read that file." });
      }
    }
    setUploading(false);
    if (parsedResults.length === 0) {
      setUploadError(failed.map((f) => `${f.name}: ${f.message}`).join(" — "));
      return;
    }

    const parsed = mergeParsedInvoiceResults(parsedResults);
    const fileWord = parsedResults.length === 1 ? "file" : "files";
    const itemWord = parsed.rows.length === 1 ? "item" : "items";
    let message = `Parsed ${parsed.rows.length} line ${itemWord} from ${parsedResults.length} ${fileWord} — review before saving.`;
    if (failed.length > 0) {
      message += ` (${failed.length} file${failed.length === 1 ? "" : "s"} couldn't be read: ${failed.map((f) => f.name).join(", ")})`;
    }
    fireToast(message, failed.length > 0 ? "info" : "success");

    onClose();
    navigate("/billing/generate", { state: { parsed } });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={() => !uploading && onClose()}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl shrink-0">
                <FileStack className="w-5 h-5 text-brand-600" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Upload Invoice</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Upload one or more PDF/Excel/CSV invoices — every file's line items are combined into one editable list.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={uploading}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shrink-0 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-14 transition-all duration-200 bg-white dark:bg-gray-900 ${
              dragging
                ? "border-brand-500 cursor-pointer"
                : "border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 cursor-pointer"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {uploading ? (
              <>
                <RefreshCw className="w-7 h-7 text-brand-500 animate-spin mb-3" />
                <p className="text-sm font-semibold text-gray-500">Reading invoice(s)…</p>
                <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
              </>
            ) : (
              <>
                <CloudUpload className="w-8 h-8 text-brand-500 mb-3" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Drop your invoice(s) here</p>
                <p className="text-xs text-gray-400 mt-1">
                  or <span className="text-brand-600 dark:text-brand-400 font-semibold">browse to upload</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-3">
                  Accepts PDF, .xlsx, .xls, or .csv — select or drop multiple to combine their line items
                </p>
              </>
            )}
          </div>
          {uploadError && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5 mt-3">
              <FileWarning className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

UploadInvoiceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default UploadInvoiceModal;
