import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, CalendarClock, ShieldAlert } from "lucide-react";
import {
  getPaymentTerms,
  createPaymentTerm,
  updatePaymentTerm,
  deletePaymentTerm,
} from "../../api/billingApi";
import { fireToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmDialog";

const EMPTY_FORM = { name: "", days: 30 };

/**
 * Payment Terms — named day-count presets (Net 30/60/90 seeded; add more
 * as needed). Picked at invoice creation (GenerateInvoicePage) to compute
 * Due Date = Invoice Date + days, replacing the old manual Billing Period
 * Start/End + Due Date pickers.
 */
const PaymentTermsTab = () => {
  const confirm = useConfirm();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setTerms(await getPaymentTerms());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (t) => {
    setEditingId(t.id);
    setForm({ name: t.name, days: t.days });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updatePaymentTerm(editingId, form);
        fireToast(`${form.name} updated`, "success");
        cancelEdit();
      } else {
        await createPaymentTerm(form);
        fireToast(`${form.name} created`, "success");
        setForm(EMPTY_FORM);
      }
      load();
    } catch (err) {
      fireToast(err.response?.data?.error || "Couldn't save payment term.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    const okConfirm = await confirm({
      title: "Delete Payment Term?",
      message: "Invoices already created with this term keep their own stored name and computed Due Date — they just won't reference this term afterward.",
      confirmLabel: "Delete",
      variant: "delete",
    });
    if (!okConfirm) return;
    if (editingId === t.id) cancelEdit();
    await deletePaymentTerm(t.id);
    fireToast(`${t.name} deleted`, "success");
    load();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="col-span-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 h-fit shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">
            {editingId ? "Edit Payment Term" : "New Payment Term"}
          </h3>
          {editingId && (
            <button
              onClick={cancelEdit}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Cancel edit"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Net 30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Days</label>
            <input
              type="number" step="1" min="0" required
              value={form.days}
              onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-[10px] text-gray-400 mt-1">Due Date = Invoice Date + this many days</p>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {editingId ? "Save Changes" : (<><Plus className="w-4 h-4" /> Add Term</>)}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="col-span-2 space-y-3">
        {loading && (
          <>
            <div className="skeleton rounded-2xl h-20 w-full" />
            <div className="skeleton rounded-2xl h-20 w-full" />
          </>
        )}
        {!loading && terms.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 border-dashed rounded-2xl">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">No Payment Terms Yet</h3>
            <p className="text-gray-500 text-xs mt-1 max-w-sm">
              Add a preset here (e.g. Net 30) to make it pickable when creating an invoice.
            </p>
          </div>
        )}
        {!loading &&
          terms.map((t) => (
            <div
              key={t.id}
              className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 flex items-center justify-between shadow-card ${
                editingId === t.id
                  ? "border-brand-300 dark:border-brand-700"
                  : "border-gray-100 dark:border-gray-800"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-4 h-4 text-brand-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.days} day{t.days === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => startEdit(t)}
                  className="text-gray-400 hover:text-brand-600 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  title="Edit term"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(t)}
                  className="text-red-500 hover:text-red-600 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg"
                  title="Delete term"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default PaymentTermsTab;
