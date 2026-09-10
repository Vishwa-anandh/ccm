import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Building2, Mail, MapPin } from "lucide-react";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../../api/billingApi";
import { fireToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmDialog";

const EMPTY_FORM = { name: "", billingAddress: "", primaryContactEmail: "" };

/**
 * Customers — Finance's list of billable customer accounts (doc §7.1).
 * Each links back to that customer's existing CCM tenant/org (or stands
 * alone if that customer hasn't been matched to one yet) — no new login is
 * ever created here, just the billing profile (address, logo, contact).
 *
 * Same list + form-column layout as PricingRulesTab.jsx; the form doubles
 * as both "New Customer" and "Edit Customer" (via `editingId`), matching
 * how AccountManager.jsx reuses one surface for both create and edit.
 */
const CustomersTab = () => {
  const confirm = useConfirm();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCustomers(await getCustomers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      billingAddress: c.billingAddress,
      primaryContactEmail: c.primaryContactEmail ?? "",
    });
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
        await updateCustomer(editingId, form);
        fireToast(`${form.name} updated`, "success");
        cancelEdit();
      } else {
        await createCustomer(form);
        fireToast(`${form.name} added`, "success");
        setForm(EMPTY_FORM);
      }
      load();
    } catch (err) {
      fireToast(err.response?.data?.error || "Couldn't save customer.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    const okConfirm = await confirm({
      title: "Delete Customer?",
      message: `Existing invoices for ${c.name} keep their own stored copy of the billing details — they just won't link back to a live customer record afterward.`,
      confirmLabel: "Delete",
      variant: "delete",
    });
    if (!okConfirm) return;
    if (editingId === c.id) cancelEdit();
    await deleteCustomer(c.id);
    fireToast(`${c.name} deleted`, "success");
    load();
  };

  return (
    // md (768px) looked wide enough in isolation, but once the sidebar's
    // width is subtracted from that, a 3-column split left ~170px per
    // column — truncating the form's inputs. lg (1024px) is where there's
    // genuinely enough room, matching the same breakpoint the Invoices/
    // Billing drill-down uses.
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="col-span-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 h-fit shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">
            {editingId ? "Edit Customer" : "New Customer"}
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
            <label className="block text-xs font-semibold text-gray-500 mb-1">Customer Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Acton Tamil School"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Billing Address</label>
            <textarea
              required
              rows={3}
              value={form.billingAddress}
              onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              placeholder={"12 Meadowbrook Rd\nActon, MA 01720"}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Primary Billing Contact</label>
            <input
              type="email"
              value={form.primaryContactEmail}
              onChange={(e) => setForm({ ...form, primaryContactEmail: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              placeholder="billing@customer.com"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {editingId ? "Save Changes" : (<><Plus className="w-4 h-4" /> Add Customer</>)}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="col-span-2 space-y-4">
        {loading && (
          <>
            <div className="skeleton rounded-2xl h-28 w-full" />
            <div className="skeleton rounded-2xl h-28 w-full" />
          </>
        )}
        {!loading &&
          customers.map((c) => (
            <div
              key={c.id}
              className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 flex items-start justify-between shadow-card ${
                editingId === c.id
                  ? "border-brand-300 dark:border-brand-700"
                  : "border-gray-100 dark:border-gray-800"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-brand-500" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white">{c.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-start gap-1 whitespace-pre-line">
                    <MapPin className="w-3 h-3 shrink-0 mt-0.5" /> {c.billingAddress}
                  </p>
                  {c.primaryContactEmail && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {c.primaryContactEmail}
                    </p>
                  )}
                  {c.orgId && (
                    <p className="text-[10px] text-brand-500 font-semibold mt-1.5">
                      Linked to CCM org — invoices appear in their existing login
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Dot-indicator badge, matching UserManagement.jsx's StatusBadge recipe */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    c.active
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${c.active ? "bg-emerald-500" : "bg-gray-400"}`} />
                  {c.active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => startEdit(c)}
                  className="text-gray-400 hover:text-brand-600 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  title="Edit customer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="text-red-500 hover:text-red-600 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg"
                  title="Delete customer"
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

export default CustomersTab;
