import React, { useEffect, useState } from "react";
import { Plus, Trash2, Percent, ShieldAlert } from "lucide-react";
import {
  getCustomers,
  getPricingRules,
  createPricingRule,
  deletePricingRule,
} from "../../api/billingApi";
import { CALC_ORDERS } from "../../utils/pricingCalc";
import { fireToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmDialog";

const VENDORS = ["azure", "aws", "btp", "gcp"];
const EMPTY_FORM = {
  customerId: "",
  vendor: "azure",
  vendorDiscountPct: 0,
  maitsysAdjustmentPct: 0,
  taxPct: 0,
  calculationOrder: CALC_ORDERS.DISCOUNT_THEN_ADJUSTMENT,
};

/**
 * Pricing Rules — per customer + vendor discount / Maitsys adjustment / tax
 * config (doc §7.2). "Only Finance leadership or an administrator role can
 * create or change a Pricing Rule" (doc §9) — this whole tab already only
 * renders inside the privileged Finance console (see BillingPage.jsx).
 */
const PricingRulesTab = () => {
  const confirm = useConfirm();
  const [customers, setCustomers] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, r] = await Promise.all([getCustomers(), getPricingRules()]);
      setCustomers(c);
      setRules(r);
      setForm((f) => ({ ...f, customerId: f.customerId || c[0]?.id || "" }));
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
      await createPricingRule(form);
      fireToast("Pricing rule created", "success");
      load();
    } catch (err) {
      fireToast(err.response?.data?.error || "Couldn't create rule.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const okConfirm = await confirm({
      title: "Delete Pricing Rule?",
      message: "Invoices already generated under this rule keep their stored calculation trail.",
      confirmLabel: "Delete",
      variant: "delete",
    });
    if (!okConfirm) return;
    await deletePricingRule(id);
    load();
  };

  const customerName = (id) => customers.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="col-span-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 h-fit shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">New Pricing Rule</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Customer</label>
            <select
              required
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Vendor</label>
            <select
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              {VENDORS.map((v) => (
                <option key={v} value={v}>{v.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Vendor Discount %</label>
              <input
                type="number" step="0.1" min="0" required
                value={form.vendorDiscountPct}
                onChange={(e) => setForm({ ...form, vendorDiscountPct: Number(e.target.value) })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-1">0 is a valid, explicit value</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Maitsys Adjustment %</label>
              <input
                type="number" step="0.1" min="0" required
                value={form.maitsysAdjustmentPct}
                onChange={(e) => setForm({ ...form, maitsysAdjustmentPct: Number(e.target.value) })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Tax %</label>
            <input
              type="number" step="0.1" min="0" required
              value={form.taxPct}
              onChange={(e) => setForm({ ...form, taxPct: Number(e.target.value) })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Calculation Order</label>
            <select
              value={form.calculationOrder}
              onChange={(e) => setForm({ ...form, calculationOrder: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value={CALC_ORDERS.DISCOUNT_THEN_ADJUSTMENT}>Discount then Adjustment</option>
              <option value={CALC_ORDERS.ADJUSTMENT_THEN_DISCOUNT}>Adjustment then Discount</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving || !form.customerId}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        </form>
      </div>

      <div className="col-span-2 space-y-3">
        {loading && <p className="text-sm text-gray-400">Loading…</p>}
        {!loading && rules.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 border-dashed rounded-2xl">
            <ShieldAlert className="w-8 h-8 text-gray-400 mb-3" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">No Pricing Rules Yet</h3>
            <p className="text-gray-500 text-xs mt-1 max-w-sm">
              A customer's lines can't be priced until a Pricing Rule exists for that customer + vendor.
            </p>
          </div>
        )}
        {!loading &&
          rules.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                  <Percent className="w-4 h-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                    {customerName(r.customerId)} · {r.vendor.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Discount {r.vendorDiscountPct}% → Adjustment {r.maitsysAdjustmentPct}% · Tax {r.taxPct}%
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {r.calculationOrder === CALC_ORDERS.ADJUSTMENT_THEN_DISCOUNT ? "Adjustment then Discount" : "Discount then Adjustment"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                className="text-red-500 hover:text-red-600 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default PricingRulesTab;
