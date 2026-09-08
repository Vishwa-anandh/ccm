import React, { useEffect, useState } from "react";
import { Plus, Building2, Mail, MapPin } from "lucide-react";
import { getCustomers, createCustomer } from "../../api/billingApi";
import { fireToast } from "../../components/ToastProvider";

const EMPTY_FORM = { name: "", billingAddress: "", primaryContactEmail: "" };

/**
 * Customers — Finance's list of billable customer accounts (doc §7.1).
 * Each links back to that customer's existing CCM tenant/org (or stands
 * alone if that customer hasn't been matched to one yet) — no new login is
 * ever created here, just the billing profile (address, logo, contact).
 */
const CustomersTab = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createCustomer(form);
      fireToast(`${form.name} added`, "success");
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      fireToast(err.response?.data?.error || "Couldn't create customer.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    // md (768px) looked wide enough in isolation, but once the sidebar's
    // width is subtracted from that, a 3-column split left ~170px per
    // column — truncating the form's inputs. lg (1024px) is where there's
    // genuinely enough room, matching the same breakpoint the Invoices/
    // Billing drill-down uses.
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="col-span-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 h-fit shadow-card">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">New Customer</h3>
        <form onSubmit={handleCreate} className="space-y-4">
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
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center disabled:opacity-50">
            <Plus className="w-4 h-4" /> Add Customer
          </button>
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
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex items-start justify-between shadow-card"
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
              {/* Dot-indicator badge, matching UserManagement.jsx's StatusBadge recipe */}
              <span
                className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  c.active
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${c.active ? "bg-emerald-500" : "bg-gray-400"}`} />
                {c.active ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default CustomersTab;
