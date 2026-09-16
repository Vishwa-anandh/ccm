import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { X, FileStack, CloudUpload, RefreshCw, FileWarning, FileText, Trash2 } from "lucide-react";
import { parseInvoiceFile, mergeParsedInvoiceResults } from "../../utils/invoiceFileParser";
import { fireToast } from "../ToastProvider";

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * UploadInvoiceModal — the Billing page's "Upload Invoice" button opens
 * this popup. It does exactly one thing: pick/drop one or more invoice
 * files, show what was picked, and — only once Finance confirms — parse
 * them. It never hosts the invoice builder itself; once parsing succeeds
 * it closes and navigates to /billing/generate (the full-page builder,
 * GenerateInvoicePage.jsx/UploadInvoiceForm.jsx) with the parsed result
 * already in hand, so that page lands straight on the review/edit/send
 * view instead of showing its own dropzone again.
 */
const UploadInvoiceModal = ({ open, onClose }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  // Files picked/dropped but not yet parsed — Finance reviews this list
  // and explicitly confirms before anything is actually read.
  const [pendingFiles, setPendingFiles] = useState([]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape" && !uploading) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, uploading]);

  // Fresh each time it opens — a previous attempt's error or leftover
  // selection shouldn't linger the next time Finance opens this popup.
  useEffect(() => {
    if (open) {
      setUploadError("");
      setPendingFiles([]);
    }
  }, [open]);

  if (!open) return null;

  const addPendingFiles = (fileList) => {
    const files = Array.from(fileList ?? []).filter(Boolean);
    if (files.length === 0) return;
    setUploadError("");
    // De-dupe by name+size — selecting the same file twice (e.g. drop,
    // then browse again) shouldn't double it up in the confirmation list.
    setPendingFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const additions = files.filter((f) => !seen.has(`${f.name}:${f.size}`));
      return [...prev, ...additions];
    });
  };

  const removePendingFile = (index) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmUpload = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    setUploadError("");
    const parsedResults = [];
    const failed = [];
    for (const file of pendingFiles) {
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
    // `replace: true` — this hop from the popup into the builder isn't a
    // page the user consciously navigated to; it shouldn't sit as its own
    // entry in browser history. Without this, pressing the browser's own
    // Back button later can land squarely on /billing/generate with its
    // (already-consumed) parsed state gone, showing a bare "drop your
    // invoice here" screen instead of returning to wherever the user
    // actually came from.
    navigate("/billing/generate", { state: { parsed }, replace: true });
  };

  const hasPending = pendingFiles.length > 0;

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
                  {hasPending
                    ? "Confirm what you're uploading before it's read."
                    : "Upload one or more PDF/Excel/CSV invoices — every file's line items are combined into one editable list."}
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

          {hasPending ? (
            <>
              {/* Confirmation list — nothing gets read until "Upload"
                  below is clicked; a file can still be removed or more
                  added first. */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
                {pendingFiles.map((file, i) => (
                  <div key={`${file.name}:${file.size}:${i}`} className="flex items-center gap-3 px-4 py-3">
                    <FileText className="w-4 h-4 text-brand-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-400">{formatBytes(file.size)}</p>
                    </div>
                    <button
                      onClick={() => removePendingFile(i)}
                      disabled={uploading}
                      aria-label={`Remove ${file.name}`}
                      className="text-red-400 hover:text-red-600 shrink-0 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 disabled:opacity-50"
                >
                  + Add another file
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => setPendingFiles([])}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={uploading}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                  {uploading
                    ? "Reading…"
                    : `Upload ${pendingFiles.length} file${pendingFiles.length === 1 ? "" : "s"}`}
                </button>
              </div>
            </>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addPendingFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-14 transition-all duration-200 bg-white dark:bg-gray-900 ${
                dragging
                  ? "border-brand-500 cursor-pointer"
                  : "border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 cursor-pointer"
              }`}
            >
              <CloudUpload className="w-8 h-8 text-brand-500 mb-3" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Drop your invoice(s) here</p>
              <p className="text-xs text-gray-400 mt-1">
                or <span className="text-brand-600 dark:text-brand-400 font-semibold">browse to upload</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-3">
                Accepts PDF, .xlsx, .xls, or .csv — select or drop multiple to combine their line items
              </p>
            </div>
          )}

          {/* Kept mounted across both states so "+ Add another file" can
              reuse it without a second <input>. */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xlsx,.xls,.csv"
            multiple
            className="hidden"
            onChange={(e) => {
              addPendingFiles(e.target.files);
              e.target.value = "";
            }}
          />

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
